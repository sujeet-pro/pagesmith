/**
 * `@pagesmith/docs` high-level validator.
 *
 * Reads the resolved docs configuration and runs:
 *  - Markdown content validation via `@pagesmith/core` (frontmatter links,
 *    image presence, hosted-image reachability when requested).
 *  - Build-output validation via `@pagesmith/site/build-validator` using the
 *    configured `basePath` and `trailingSlash`.
 *
 * The docs preset supports `<picture>`-based light/dark diagrams, so the
 * build-output checks for theme variants and sidebar/TOC in-page anchors are
 * enabled by default.
 *
 * This API exists so CLI callers, the MCP server, and the in-repo docs
 * pipeline all share the same logic.
 */

import { existsSync, statSync } from "fs";
import { dirname, resolve } from "path";
import {
  formatContentValidationReport,
  loadContentSchemaMap,
  validateContent,
  type FileSchemaEntry,
  type ValidateContentSummary,
} from "@pagesmith/core";
import {
  runBuildValidation,
  validateBuildOutput,
  type BuildValidationResult,
} from "@pagesmith/site/build-validator";
import { resolveDocsConfigAsync, type ResolvedDocsConfig } from "./config";

export type DocsValidateOptions = {
  /** Explicit config path (defaults to pagesmith.config.json5 in cwd). */
  configPath?: string;
  /** Content dir override. */
  contentDir?: string;
  /** Build output dir override. */
  outDir?: string;
  /** Base path override. */
  basePath?: string;
  /** Trailing-slash override. */
  trailingSlash?: boolean;
  /** Skip content validation entirely. */
  skipContent?: boolean;
  /** Skip build-output validation entirely. */
  skipBuild?: boolean;
  /** Fetch external URLs to verify reachability. */
  checkExternal?: boolean;
  /** Fetch timeout (ms). Default 10000. */
  timeoutMs?: number;
  /** Fetch concurrency. Default 8. */
  concurrency?: number;
  /** Print files with no issues to the content report. */
  showClean?: boolean;
  /**
   * Whether to enforce that themed `<picture>` elements expose both a light
   * and a dark variant. Default: true (the docs preset renders themed
   * diagrams this way).
   */
  requireThemeVariants?: boolean;
  /**
   * Whether to enforce raster `<picture>` fallbacks have webp+avif siblings.
   * Default: false (the docs content site largely uses SVG diagrams).
   */
  requireRasterModernFormats?: boolean;
  /**
   * Directory names to exclude from build-output validation. Useful when the
   * docs output bundles sub-sites (e.g. `examples/`) with their own build
   * configuration. Default: `['examples']`.
   */
  excludeBuildDirs?: string[];
  /**
   * Filenames the build output must contain. Defaults to the standard docs
   * deliverables (`favicon.svg|favicon.ico`, `sitemap.xml`, `robots.txt`,
   * `llms.txt`, `llms-full.txt`). Pass `[]` to skip the check entirely.
   */
  requiredOutputFiles?: Array<string | string[]>;
  /**
   * When true, enforce that every page is reachable both at `path.html` and
   * `path/index.html` so links survive either trailing-slash routing mode.
   * Default: false.
   */
  requireBothTrailingSlashForms?: boolean;
  /**
   * When true, non-image internal markdown links must resolve to another
   * markdown file (rather than an arbitrary asset). Default: false — most
   * docs sites intentionally link into passthrough assets.
   */
  internalLinksMustBeMarkdown?: boolean;
  /**
   * When true, every internal page link must be authored as a relative
   * path ending in `.md` / `.mdx` (for example `./relative/README.md`).
   * Site-absolute URLs like `/guide/foo` and bare relative forms like
   * `./foo` / `./foo/` become errors. Default: true under the docs preset
   * so the source form is always a real, grep-able file path.
   */
  requireCanonicalInternalLinks?: boolean;
  /**
   * When true, every image must carry non-empty alt text. Default: true.
   */
  requireAltText?: boolean;
  /**
   * When true, fail if the markdown contains a raw `<img>` HTML tag.
   * Default: true.
   */
  forbidHtmlImgTag?: boolean;
  /**
   * When true, `-light`/`-dark` image references must appear as an adjacent
   * pair. Default: true.
   */
  requireThemeVariantPairs?: boolean;
  /**
   * Path to a `content.config.{ts,mts,mjs,js}` file declaring typed
   * collections. When omitted, `validateDocs` looks for one in the project
   * root (the directory of the resolved pagesmith config) and then in the
   * current working directory. Pass `false` to disable auto-loading.
   */
  contentConfig?: string | false;
  /** Stream console output while validating. Default true. */
  verbose?: boolean;
};

export type DocsValidateResult = {
  config: ResolvedDocsConfig;
  content?: ValidateContentSummary;
  build?: BuildValidationResult;
  errors: number;
  warnings: number;
  passed: boolean;
};

/**
 * Run docs validation against a `pagesmith.config.json5`.
 *
 * Callers get back the merged summaries plus total counts so they can either
 * render a custom report or exit-code on `errors > 0`.
 */
/**
 * Convert the resolved config's asset mappings into `additionalRoots`
 * entries that the link validator can use to resolve site-absolute URLs.
 *
 * Each docs `assets[<prefix>]` array can contain file paths (which expose a
 * single URL) or directories (which expose every file inside). File-only
 * entries are folded into a synthetic directory root on their parent
 * directory so that the prefix still maps to a filesystem root.
 */
function buildAssetRoots(assets: Map<string, string[]>): Array<{ prefix: string; dir: string }> {
  const roots: Array<{ prefix: string; dir: string }> = [];
  for (const [prefix, sources] of assets) {
    // Group entries by their filesystem parent so we do not add duplicate
    // roots for the same directory.
    const dirs = new Set<string>();
    for (const source of sources) {
      try {
        const stat = statSync(source);
        if (stat.isDirectory()) {
          dirs.add(source);
        } else {
          dirs.add(dirname(source));
        }
      } catch {
        // Missing asset source; skip it.
      }
    }
    for (const dir of dirs) {
      roots.push({ prefix, dir });
    }
  }
  return roots;
}

export async function validateDocs(options: DocsValidateOptions = {}): Promise<DocsValidateResult> {
  const config = await resolveDocsConfigAsync(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  });

  const contentDir = options.contentDir ? resolve(options.contentDir) : config.contentDir;
  const outDir = options.outDir ? resolve(options.outDir) : config.outDir;
  const basePath = options.basePath ?? config.basePath;
  const trailingSlash = options.trailingSlash ?? config.trailingSlash;
  const excludeBuildDirs = options.excludeBuildDirs ?? ["examples"];

  const verbose = options.verbose ?? true;

  let errors = 0;
  let warnings = 0;
  let content: ValidateContentSummary | undefined;
  let build: BuildValidationResult | undefined;

  if (!options.skipContent) {
    if (!existsSync(contentDir)) {
      throw new Error(`Content directory not found: ${contentDir}`);
    }
    if (verbose) console.info(`Validating content: ${contentDir}`);
    // Build additional resolution roots so links like /favicon.svg resolve
    // against publicDir, `/prompts/setup-core.md` resolves against the
    // configured assets mapping source dirs, and any link referring to a
    // docs-generated asset (sitemap.xml, favicon, etc.) resolves against
    // the existing build output when it is available.
    const additionalRoots: Array<{ prefix: string; dir: string }> = [];
    if (existsSync(config.publicDir)) {
      additionalRoots.push({ prefix: "/", dir: config.publicDir });
    }
    additionalRoots.push(...buildAssetRoots(config.assets));
    if (existsSync(outDir)) {
      // Content URLs are authored without the site base path (e.g.
      // `/favicon.svg`) but get prefixed with `basePath` at build time, so
      // their resolved location is `<outDir>/favicon.svg`. Add outDir both
      // with the bare prefix and the `basePath` prefix so either form in
      // source markdown resolves correctly.
      additionalRoots.push({ prefix: "/", dir: outDir });
      if (basePath) {
        additionalRoots.push({ prefix: basePath, dir: outDir });
      }
    }

    // Auto-load content.config.* when the user hasn't opted out, so each
    // collection's Zod schema applies to the markdown files it owns.
    let schemaByFile: Map<string, FileSchemaEntry> | undefined;
    if (options.contentConfig !== false) {
      const searchDirs: string[] = [];
      if (typeof options.contentConfig === "string") {
        // Caller-provided path: treat its directory as the project root.
        const explicit = resolve(options.contentConfig);
        searchDirs.push(dirname(explicit));
      } else {
        // Default: look next to the resolved pagesmith config, then in cwd.
        searchDirs.push(config.rootDir, process.cwd());
      }
      try {
        const loaded = await loadContentSchemaMap(searchDirs);
        if (loaded) {
          schemaByFile = loaded.schemaByFile;
          if (verbose) {
            const collectionCount = Object.keys(loaded.collections).length;
            console.info(
              `Loaded content.config from ${loaded.configPath} (${loaded.schemaByFile.size} markdown files mapped across ${collectionCount} collection${collectionCount === 1 ? "" : "s"})`,
            );
          }
        }
      } catch (err) {
        if (verbose) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(
            `Failed to load content.config — continuing without per-file schemas: ${message}`,
          );
        }
      }
    }

    content = await validateContent({
      contentDir,
      collectionName: "docs",
      resolveFrontmatterSchema: schemaByFile
        ? (filePath: string) => schemaByFile.get(filePath)?.schema
        : undefined,
      linkValidator: {
        rootDir: contentDir,
        basePath,
        additionalRoots,
        internalLinksMustBeMarkdown: options.internalLinksMustBeMarkdown,
        requireCanonicalInternalLinks: options.requireCanonicalInternalLinks ?? true,
        requireAltText: options.requireAltText,
        forbidHtmlImgTag: options.forbidHtmlImgTag,
        requireThemeVariantPairs: options.requireThemeVariantPairs,
        checkExternalReachability: options.checkExternal,
        fetchTimeoutMs: options.timeoutMs,
        fetchConcurrency: options.concurrency,
      },
    });
    if (verbose) {
      console.info(formatContentValidationReport(content, { showClean: options.showClean }));
    }
    errors += content.errors;
    warnings += content.warnings;
  }

  if (!options.skipBuild) {
    if (!existsSync(outDir)) {
      if (verbose) {
        console.info(
          `Skipping build validation — output directory does not exist: ${outDir}\n` +
            `  Run 'pagesmith-docs build' first or pass --skip-build.`,
        );
      }
    } else {
      const requiredOutputFiles =
        options.requiredOutputFiles ??
        ([
          ["favicon.svg", "favicon.ico"],
          "sitemap.xml",
          "robots.txt",
          "llms.txt",
          "llms-full.txt",
        ] satisfies Array<string | string[]>);

      const buildOpts = {
        outDir,
        basePath,
        trailingSlash,
        exclude: excludeBuildDirs,
        requireRasterModernFormats: options.requireRasterModernFormats ?? false,
        requireThemeVariants: options.requireThemeVariants ?? true,
        checkInPageAnchors: true,
        requiredFiles: requiredOutputFiles,
        requireBothTrailingSlashForms: options.requireBothTrailingSlashForms ?? false,
      };
      if (verbose) {
        runBuildValidation(buildOpts);
      }
      build = validateBuildOutput(buildOpts);
      errors += build.errors.length;
      warnings += build.warnings.length;
    }
  }

  return {
    config,
    content,
    build,
    errors,
    warnings,
    passed: errors === 0,
  };
}
