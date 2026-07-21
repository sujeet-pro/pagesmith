import { copyPublicFiles, emitGeneratedImageVariants, hashAssets } from "@pagesmith/core/assets";
import { buildCss } from "@pagesmith/site/css";
import {
  generateSitemap as generateSitemapXml,
  runPagefindIndexing,
} from "@pagesmith/site/ssg-utils";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { basename, dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import {
  getThemeRuntimeEntry,
  getThemeStylesEntry,
  reportConfigIssues,
  resolveDocsConfigAsync,
  validateConfig,
  type DocsBuildOptions,
  type ResolvedDocsConfig,
} from "./config.js";
import { collectContentAssets, type DocsPage } from "./content.js";
import { renderDocs } from "./render.js";

async function bundleThemeAssets(config: ResolvedDocsConfig): Promise<void> {
  const assetsDir = join(config.outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  const css = buildCss(getThemeStylesEntry(), { minify: true });
  writeFileSync(join(assetsDir, "style.css"), css);

  const { build } = await import("rolldown");

  await build({
    input: getThemeRuntimeEntry(),
    output: {
      dir: assetsDir,
      entryFileNames: "main.js",
      format: "esm",
      minify: true,
    },
    platform: "browser",
    logLevel: "warn",
  });

  // Copy bundled font files to assets/fonts/
  const sitePkgDir = dirname(fileURLToPath(import.meta.resolve("@pagesmith/site/package.json")));
  const siteFontsDir = join(sitePkgDir, "assets", "fonts");
  const outFontsDir = join(assetsDir, "fonts");
  mkdirSync(outFontsDir, { recursive: true });
  for (const file of readdirSync(siteFontsDir)) {
    if (file.endsWith(".woff2")) {
      copyFileSync(join(siteFontsDir, file), join(outFontsDir, file));
    }
  }
}

function copyPublicAssets(config: ResolvedDocsConfig): void {
  copyPublicFiles(config.publicDir, config.outDir);
}

function copyDirRecursive(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const PRESERVED_OUT_DIR_ENTRIES = new Set(["examples"]);

function assertValidDocsConfig(
  config: ResolvedDocsConfig,
  options: { surroundWithBlankLines?: boolean } = {},
) {
  const issues = validateConfig(config);
  if (issues.length === 0) return;

  if (options.surroundWithBlankLines) console.info("");
  const hasErrors = reportConfigIssues(issues);
  if (options.surroundWithBlankLines) console.info("");

  if (hasErrors) {
    throw new Error("Config validation failed — fix the errors above before building.");
  }
}

function clearDocsOutputDir(outDir: string): void {
  mkdirSync(outDir, { recursive: true });

  for (const entry of readdirSync(outDir, { withFileTypes: true })) {
    if (PRESERVED_OUT_DIR_ENTRIES.has(entry.name)) continue;
    rmSync(join(outDir, entry.name), { recursive: true, force: true });
  }
}

function syncDocsOutput(stagingDir: string, outDir: string): void {
  clearDocsOutputDir(outDir);
  copyDirRecursive(stagingDir, outDir);
}

function copyMappedAssets(config: ResolvedDocsConfig): void {
  for (const [outputPath, sources] of config.assets) {
    // Normalize output path: "/" → outDir root, "/api" → outDir/api
    const destDir = outputPath === "/" ? config.outDir : join(config.outDir, outputPath);
    mkdirSync(destDir, { recursive: true });

    for (const sourcePath of sources) {
      if (!existsSync(sourcePath)) continue;

      const stat = statSync(sourcePath);
      if (stat.isDirectory()) {
        copyDirRecursive(sourcePath, join(destDir, basename(sourcePath)));
      } else {
        copyFileSync(sourcePath, join(destDir, basename(sourcePath)));
      }
    }
  }
}

async function copyContentAssetsToOutput(
  outDir: string,
  assets: ReturnType<typeof collectContentAssets>,
): Promise<void> {
  if (assets.byPath.size === 0) return;

  const assetsDir = join(outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  for (const [relPath, sourcePath] of assets.byPath) {
    const destPath = join(assetsDir, relPath);
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(sourcePath, destPath);
  }

  await emitGeneratedImageVariants(assetsDir, assets);
}

/**
 * Build the docs sitemap by delegating to the shared `@pagesmith/site`
 * serializer. Draft pages are excluded; the home page is expressed as the
 * empty route so it maps to the base URL.
 *
 * Output matches the previous in-package implementation byte-for-byte for a
 * well-formed `origin` (no trailing slash — the common case). The one
 * behavioral delta: the shared serializer runs `normalizeOrigin`, so an
 * `origin` that ends in `/` now yields clean `<loc>`s instead of the doubled
 * slash the old string concatenation produced (`https://x.com//docs/…`). Docs
 * config does not normalize `origin`, so this is an improvement, not a
 * regression.
 */
function generateSitemap(pages: DocsPage[], config: ResolvedDocsConfig): string {
  const routes = pages
    .filter((p) => !p.frontmatter.draft)
    .map((p) => (p.isHome ? "" : p.routePath));
  return generateSitemapXml(routes, { origin: config.origin, basePath: config.basePath });
}

const LLMS_FILES = ["llms.txt", "llms-full.txt"];

function copyLlmsFiles(config: ResolvedDocsConfig): void {
  for (const fileName of LLMS_FILES) {
    const sourcePath = join(config.rootDir, fileName);
    const destPath = join(config.outDir, fileName);
    if (existsSync(sourcePath) && !existsSync(destPath)) {
      copyFileSync(sourcePath, destPath);
    }
  }
}

export async function build(options: DocsBuildOptions = {}): Promise<void> {
  const startTime = performance.now();
  const config = await resolveDocsConfigAsync(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  });

  // Validate config and report issues
  assertValidDocsConfig(config, { surroundWithBlankLines: true });

  const stagingDir = mkdtempSync(join(tmpdir(), "pagesmith-docs-build-"));
  const buildConfig: ResolvedDocsConfig = { ...config, outDir: stagingDir };

  try {
    const contentAssets = collectContentAssets(buildConfig.contentDir);

    await bundleThemeAssets(buildConfig);
    const renderStart = performance.now();
    const { pages } = await renderDocs(buildConfig);
    const renderElapsed = Math.round(performance.now() - renderStart);
    console.info(`  Rendered ${pages.length} pages in ${renderElapsed}ms`);
    copyPublicAssets(buildConfig);
    copyMappedAssets(buildConfig);
    await copyContentAssetsToOutput(buildConfig.outDir, contentAssets);

    // Copy favicon to output if not already present (e.g. bundled default not in public/)
    if (buildConfig.favicon) {
      const faviconDest = join(buildConfig.outDir, basename(buildConfig.favicon));
      if (!existsSync(faviconDest)) {
        copyFileSync(buildConfig.favicon, faviconDest);
      }
    }

    // Auto-copy llms.txt convention files from project root
    copyLlmsFiles(buildConfig);

    // Auto-generate .nojekyll for GitHub Pages compatibility
    writeFileSync(join(buildConfig.outDir, ".nojekyll"), "");

    // Auto-generate sitemap.xml when origin is configured
    if (buildConfig.sitemap && buildConfig.origin !== "https://example.com") {
      writeFileSync(join(buildConfig.outDir, "sitemap.xml"), generateSitemap(pages, buildConfig));
    }

    // Auto-generate robots.txt if not already present (from publicDir or assets)
    const robotsPath = join(buildConfig.outDir, "robots.txt");
    if (!existsSync(robotsPath)) {
      const hasSitemap = buildConfig.sitemap && buildConfig.origin !== "https://example.com";
      const sitemapLine = hasSitemap
        ? `\nSitemap: ${buildConfig.origin}${buildConfig.basePath}/sitemap.xml`
        : "";
      writeFileSync(robotsPath, `User-agent: *\nAllow: /${sitemapLine}\n`);
    }

    if (buildConfig.search.enabled) {
      console.info("");
      try {
        runPagefindIndexing(buildConfig.outDir, {
          extraFlags: buildConfig.search.pagefindFlags,
        });
      } catch (error) {
        throw new Error(
          `Pagefind indexing failed: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }

    hashAssets(buildConfig.outDir, buildConfig.contentDir);

    syncDocsOutput(buildConfig.outDir, config.outDir);

    // Build summary
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    const sectionCount = new Set(pages.map((p) => p.section).filter(Boolean)).size;
    console.info("");
    console.info(`  Built ${pages.length} pages in ${sectionCount} sections (${duration}s)`);
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
}

/**
 * Rebuild content only — skips theme bundling and Pagefind indexing.
 * Used by the dev server for fast content-only rebuilds.
 */
export async function rebuildContent(options: DocsBuildOptions = {}): Promise<void> {
  const config = await resolveDocsConfigAsync(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  });

  assertValidDocsConfig(config);

  const contentAssets = collectContentAssets(config.contentDir);

  const { pages } = await renderDocs(config);
  copyPublicAssets(config);
  copyMappedAssets(config);
  await copyContentAssetsToOutput(config.outDir, contentAssets);
  copyLlmsFiles(config);

  if (config.favicon) {
    const faviconDest = join(config.outDir, basename(config.favicon));
    if (!existsSync(faviconDest)) {
      copyFileSync(config.favicon, faviconDest);
    }
  }

  // Regenerate sitemap/robots/nojekyll for content-only rebuilds
  writeFileSync(join(config.outDir, ".nojekyll"), "");
  if (config.sitemap && config.origin !== "https://example.com") {
    writeFileSync(join(config.outDir, "sitemap.xml"), generateSitemap(pages, config));
  }
  const robotsPath = join(config.outDir, "robots.txt");
  if (!existsSync(robotsPath)) {
    const hasSitemap = config.sitemap && config.origin !== "https://example.com";
    const sitemapLine = hasSitemap
      ? `\nSitemap: ${config.origin}${config.basePath}/sitemap.xml`
      : "";
    writeFileSync(robotsPath, `User-agent: *\nAllow: /${sitemapLine}\n`);
  }

  hashAssets(config.outDir, config.contentDir);
}
