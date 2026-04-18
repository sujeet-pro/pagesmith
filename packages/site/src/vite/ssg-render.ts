/**
 * Route collection, pre-rendering, and content asset handling for the SSG plugin.
 *
 * Provides:
 * - Content companion asset discovery and copying
 * - HTML asset reference rewriting
 * - SSR bundle building via child process
 * - Route pre-rendering to static HTML files
 * - Font and public file copying
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { basename, dirname, extname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { ResolvedConfig } from "vite";
import {
  type ContentAssetMap,
  CONVERTIBLE_IMAGE_EXTS,
  emitGeneratedImageVariants,
  collectContentAssets,
  CONTENT_ASSET_EXTS,
  copyPublicFiles,
  getGeneratedImageVariantPath,
  hashAssets,
  resolveGeneratedImageSourceAssetPath,
} from "../assets/index.js";
import type { SsgRenderConfig } from "./ssg-plugin";

export const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const LLMS_FILES = ["llms.txt", "llms-full.txt"];

// ── Content directory helpers ──

export function resolveContentDirs(projectRoot: string, contentDirs: string[] = []): string[] {
  return contentDirs.map((dir) => resolve(projectRoot, dir));
}

function splitRef(ref: string): { pathname: string; suffix: string } {
  const pathname = ref.split(/[?#]/u, 1)[0] ?? ref;
  return { pathname, suffix: ref.slice(pathname.length) };
}

function isRelativeRef(ref: string): boolean {
  const { pathname } = splitRef(ref);
  if (!pathname) return false;
  if (pathname.startsWith("/") || pathname.startsWith("//")) return false;
  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(pathname);
}

function isAssetReference(ref: string): boolean {
  if (!isRelativeRef(ref)) return false;
  const { pathname } = splitRef(ref);
  return CONTENT_ASSET_EXTS.has(extname(pathname).toLowerCase());
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function findPublishedAssetPath(assetMap: ContentAssetMap, assetPath: string): string | undefined {
  const normalizedPath = normalizePath(assetPath);

  if (assetMap.byPath.has(normalizedPath)) return normalizedPath;
  if (assetMap.byPath.has(assetPath)) return normalizePath(assetPath);

  for (const key of assetMap.byPath.keys()) {
    if (normalizePath(key) === normalizedPath) return normalizedPath;
  }

  return undefined;
}

function normalizeAssetCandidates(candidates: string[]): string[] {
  return Array.from(new Set(candidates.map((candidate) => normalizePath(candidate)))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function normalizeRouteHint(routeHint?: string): string {
  return normalizePath(routeHint ?? "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

function getRouteDir(routeHint?: string): string {
  const normalized = normalizeRouteHint(routeHint);
  if (!normalized) return "";
  const segments = normalized.split("/");
  segments.pop();
  return segments.join("/");
}

function resolveRelativeAssetPath(pathname: string, baseDir = ""): string {
  const rawSegments = normalizePath(pathname.replace(/^\.\//, "")).split("/");
  const resolvedSegments = normalizePath(baseDir).split("/").filter(Boolean);

  for (const segment of rawSegments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      resolvedSegments.pop();
      continue;
    }
    resolvedSegments.push(segment);
  }

  return resolvedSegments.join("/");
}

function resolveAssetPathByBasename(
  assetBasename: string,
  assetMap: ContentAssetMap,
  routeHint?: string,
): string | undefined {
  const candidates = assetMap.byBasename.get(assetBasename);
  if (candidates?.length === 1) return normalizePath(candidates[0]);
  if (!candidates || candidates.length === 0) return undefined;

  const normalizedCandidates = normalizeAssetCandidates(candidates);

  const exactRoute = normalizeRouteHint(routeHint);
  if (exactRoute) {
    const exactMatch = normalizedCandidates.find((candidate) =>
      candidate.startsWith(`${exactRoute}/`),
    );
    if (exactMatch) return exactMatch;
  }

  const routeDir = getRouteDir(routeHint);
  if (routeDir) {
    const dirMatch = normalizedCandidates.find((candidate) => candidate.startsWith(`${routeDir}/`));
    if (dirMatch) return dirMatch;
  }

  return normalizedCandidates[0];
}

function resolveGeneratedAssetPathByBasename(
  requestedAssetPath: string,
  assetMap: ContentAssetMap,
  routeHint?: string,
): string | undefined {
  const requestedExt = extname(requestedAssetPath).toLowerCase();
  if (requestedExt !== ".avif" && requestedExt !== ".webp") return undefined;

  const basenameWithoutExt = (requestedAssetPath.split("/").pop() ?? requestedAssetPath).slice(
    0,
    -requestedExt.length,
  );

  for (const sourceExt of CONVERTIBLE_IMAGE_EXTS) {
    const sourceBasename = `${basenameWithoutExt}${sourceExt}`;
    const sourceAssetPath = resolveAssetPathByBasename(sourceBasename, assetMap, routeHint);
    if (sourceAssetPath) {
      return getGeneratedImageVariantPath(
        sourceAssetPath,
        requestedExt.slice(1) as "avif" | "webp",
      );
    }
  }

  return undefined;
}

function resolvePublishedAssetPathname(
  pathname: string,
  assetMap?: ContentAssetMap,
  routeHint?: string,
): string {
  const routeDir = getRouteDir(routeHint);
  const exactRoute = normalizeRouteHint(routeHint);
  const candidatePaths = Array.from(
    new Set([
      resolveRelativeAssetPath(pathname, routeDir),
      resolveRelativeAssetPath(pathname, exactRoute),
    ]),
  );

  if (!assetMap) return candidatePaths[0] ?? resolveRelativeAssetPath(pathname);

  for (const requestedAssetPath of candidatePaths) {
    const publishedPath = findPublishedAssetPath(assetMap, requestedAssetPath);
    if (publishedPath) {
      return publishedPath;
    }
    if (resolveGeneratedImageSourceAssetPath(requestedAssetPath, assetMap)) {
      return requestedAssetPath;
    }
  }

  const generatedFallback = resolveGeneratedAssetPathByBasename(
    candidatePaths[0] ?? pathname,
    assetMap,
    routeHint,
  );
  if (generatedFallback) {
    return generatedFallback;
  }

  const basenameFallback = resolveAssetPathByBasename(
    pathname.split("/").pop() ?? pathname,
    assetMap,
    routeHint,
  );
  return basenameFallback ?? candidatePaths[0] ?? pathname;
}

function rewriteSrcsetAttribute(
  srcset: string,
  basePrefix: string,
  assetMap?: ContentAssetMap,
  routeHint?: string,
): string {
  return srcset
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;

      const [rawUrl, ...descriptor] = trimmed.split(/\s+/);
      if (!isAssetReference(rawUrl)) return trimmed;

      const { pathname, suffix } = splitRef(rawUrl);
      const resolvedPath = resolvePublishedAssetPathname(pathname, assetMap, routeHint);
      return [`${basePrefix}/assets/${resolvedPath}${suffix}`, ...descriptor].join(" ");
    })
    .join(", ");
}

/**
 * Rewrite relative content asset references in rendered HTML to absolute
 * `/assets/` paths. When an `assetMap` is provided, uses directory-preserving
 * paths to avoid basename collisions. The optional `routeHint` disambiguates
 * when multiple assets share the same basename by matching the route path
 * against the asset's content-relative directory.
 */
export function rewriteContentAssetRefs(
  html: string,
  base: string,
  assetMap?: ContentAssetMap,
  routeHint?: string,
): string {
  const basePrefix = base.replace(/\/+$/u, "");

  return html.replace(
    /(src|href|srcset)=(?:"([^"]+)"|'([^']+)')/g,
    (match, attr: string, doubleRef: string | undefined, singleRef: string | undefined) => {
      const ref = doubleRef ?? singleRef ?? "";
      const quote = doubleRef !== undefined ? '"' : "'";
      if (attr === "srcset") {
        const rewrittenSrcset = rewriteSrcsetAttribute(ref, basePrefix, assetMap, routeHint);
        return rewrittenSrcset === ref ? match : `${attr}=${quote}${rewrittenSrcset}${quote}`;
      }
      if (!isAssetReference(ref)) return match;

      const { pathname, suffix } = splitRef(ref);
      const resolvedPath = resolvePublishedAssetPathname(pathname, assetMap, routeHint);

      return `${attr}=${quote}${basePrefix}/assets/${resolvedPath}${suffix}${quote}`;
    },
  );
}

function collectTagAttributeValues(
  html: string,
  tagName: string,
  attributeName: string,
  extension: string,
): string[] {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedExtension = extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<${escapedTagName}\\b[^>]*\\b${escapedAttributeName}=(["'])([^"'<>]+${escapedExtension}(?:[?#][^"'<>]*)?)\\1[^>]*>`,
    "gi",
  );

  return Array.from(html.matchAll(pattern), (match) => match[2]);
}

async function copyContentAssetsToOutDir(outDir: string, assets: ContentAssetMap): Promise<void> {
  if (assets.byPath.size === 0) return;

  for (const [relPath, sourcePath] of assets.byPath) {
    const destPath = join(outDir, "assets", relPath);
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(sourcePath, destPath);
  }

  await emitGeneratedImageVariants(join(outDir, "assets"), assets);
}

function copyConventionTextFiles(projectRoot: string, outDir: string): void {
  for (const fileName of LLMS_FILES) {
    const sourcePath = join(projectRoot, fileName);
    const destPath = join(outDir, fileName);
    if (existsSync(sourcePath) && !existsSync(destPath)) {
      copyFileSync(sourcePath, destPath);
    }
  }
}

// ── Build-time rendering ──

export type SsgBuildContext = {
  /** Vite resolved config */
  config: ResolvedConfig;
  /** Absolute path to the project root */
  projectRoot: string;
  /** Base path without trailing slash (e.g., '/my-site') */
  base: string;
  /** Absolute path to the build output directory */
  outDir: string;
  /** Resolved content directories (absolute paths) */
  contentDirs: string[];
  /** Path to the SSR entry module */
  entry: string;
  /** Output file format: false → path.html, true → path/index.html */
  trailingSlash: boolean;
};

/**
 * Run the full SSG build: SSR bundle, route pre-rendering, asset copying.
 *
 * Returns the number of pages rendered.
 */
export async function renderStaticSite(context: SsgBuildContext): Promise<number> {
  const { config, projectRoot, base, outDir, contentDirs, entry, trailingSlash } = context;

  console.info("\nSSG: Starting static site generation...");

  const contentAssets = collectContentAssets(contentDirs);

  // Copy bundled font assets from @pagesmith/site
  copyFontAssets(outDir);

  // Copy public/ files (favicon etc.)
  const publicDir = join(projectRoot, "public");
  copyPublicFiles(publicDir, outDir);

  // Preserve root AI context files in static outputs when present.
  copyConventionTextFiles(projectRoot, outDir);

  // Discover built asset paths from the client build output
  const { cssPath, jsPath } = discoverBuiltAssets(outDir, base);

  // SSR build — use child process to avoid nested Vite resolution issues
  console.info("SSG: Building SSR bundle...");
  await buildSsrBundle(config, projectRoot, outDir, entry);

  // Load SSR module — derive output filename from the configured entry path
  const entryBaseName = basename(entry).replace(/\.(c|m)?[jt]sx?$/u, ".js");
  const serverDir = join(outDir, ".server");
  const serverEntry = join(serverDir, entryBaseName);
  const ssrMod = await import(pathToFileURL(serverEntry).href);

  const renderConfig: SsgRenderConfig = {
    base,
    root: projectRoot,
    cssPath,
    jsPath,
    searchEnabled: true,
    isDev: false,
  };

  // Get routes and render with bounded concurrency
  const routes: string[] = await ssrMod.getRoutes(renderConfig);
  console.info(`SSG: Rendering ${routes.length} pages...`);

  const concurrency = Math.min(routes.length, 8);
  let routeIndex = 0;

  async function renderWorker(): Promise<void> {
    while (routeIndex < routes.length) {
      const i = routeIndex++;
      const route = routes[i];
      const routePath = route === "/" ? "" : route.replace(/^\//, "");
      const html = rewriteContentAssetRefs(
        await ssrMod.render(route, renderConfig),
        base,
        contentAssets,
        routePath,
      );
      const content = `<!DOCTYPE html>\n${html}`;
      const outputPath =
        route === "/" || trailingSlash
          ? join(outDir, routePath, "index.html")
          : join(outDir, `${routePath}.html`);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, content);

      if (route === "/404") {
        writeFileSync(join(outDir, "404.html"), content);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => renderWorker());
  await Promise.all(workers);

  await copyContentAssetsToOutDir(outDir, contentAssets);

  // Hash all assets and rewrite HTML references to hashed paths
  hashAssets(outDir, contentDirs);

  // Cleanup SSR build
  rmSync(serverDir, { recursive: true, force: true });

  return routes.length;
}

function copyFontAssets(outDir: string): void {
  const sitePkgDir = dirname(fileURLToPath(import.meta.resolve("@pagesmith/site/package.json")));
  const siteFontsDir = join(sitePkgDir, "assets", "fonts");
  const outFontsDir = join(outDir, "assets", "fonts");
  mkdirSync(outFontsDir, { recursive: true });
  for (const file of readdirSync(siteFontsDir)) {
    if (file.endsWith(".woff2")) {
      copyFileSync(join(siteFontsDir, file), join(outFontsDir, file));
    }
  }
  copyFileSync(join(sitePkgDir, "assets", "fonts.css"), join(outDir, "assets", "fonts.css"));
}

export function discoverBuiltAssets(
  outDir: string,
  base: string,
): { cssPath: string; jsPath: string | undefined } {
  const builtIndex = join(outDir, "index.html");
  let cssPath = `${base}/assets/style.css`;
  let jsPath: string | undefined;
  if (existsSync(builtIndex)) {
    const html = readFileSync(builtIndex, "utf-8");
    const cssMatches = collectTagAttributeValues(html, "link", "href", ".css");
    const jsMatches = collectTagAttributeValues(html, "script", "src", ".js");
    if (cssMatches[0]) cssPath = cssMatches[0];
    if (jsMatches[0]) jsPath = jsMatches[0];
  }
  return { cssPath, jsPath };
}

async function buildSsrBundle(
  config: ResolvedConfig,
  projectRoot: string,
  outDir: string,
  entry: string,
): Promise<void> {
  const { execFileSync } = await import("child_process");
  const serverDir = join(outDir, ".server");
  const ssrEntry = resolve(projectRoot, entry);

  // Resolve string aliases to absolute paths so the child SSR build
  // doesn't break on relative replacements like "#schemas": "./schemas".
  const resolvedAliases = config.resolve.alias
    .filter((a): a is { find: string; replacement: string } => typeof a.find === "string")
    .map((a) => ({
      find: a.find,
      replacement: a.replacement.startsWith(".")
        ? resolve(projectRoot, a.replacement)
        : a.replacement,
    }));

  const hasAliases = resolvedAliases.length > 0;
  const aliasPlugin = hasAliases
    ? `{
        name: 'pagesmith:ssr-aliases',
        configResolved(c) {
          const regexpAliases = c.resolve.alias.filter(a => a.find instanceof RegExp);
          c.resolve.alias = [...${JSON.stringify(resolvedAliases)}, ...regexpAliases];
        },
      }`
    : "";

  const buildScript = `
    import { build } from 'vite';
    await build({
      root: ${JSON.stringify(projectRoot)},
      logLevel: 'warn',
      mode: ${JSON.stringify(config.mode)},
      ${hasAliases ? `plugins: [${aliasPlugin}],` : ""}
      ssr: {
        // Bundle CJS-only packages so named exports work in the ESM SSR bundle.
        noExternal: ['clsx'],
      },
      build: {
        ssr: ${JSON.stringify(ssrEntry)},
        outDir: ${JSON.stringify(serverDir)},
        emptyOutDir: true,
      },
    });
  `;
  execFileSync(process.execPath, ["--input-type=module", "-e", buildScript], {
    stdio: "inherit",
    cwd: projectRoot,
  });
}
