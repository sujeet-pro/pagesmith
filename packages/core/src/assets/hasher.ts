/**
 * Demand-driven asset pipeline.
 *
 * Instead of blindly copying all content assets to dist, this:
 *   1. Hashes pre-existing dist/assets/ files (CSS, JS, fonts — already there from bundling)
 *   2. Scans generated HTML for /assets/* references
 *   3. For each referenced content asset not yet in dist, finds the source
 *      file in the content directory, copies it with a content hash
 *   4. Rewrites all HTML references to hashed paths
 *
 * Content assets are only copied if actually referenced in the output HTML.
 * Public assets (favicons, robots.txt) are handled separately by copyPublicFiles.
 */

import { createHash } from "crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import { basename, dirname, extname, join, relative } from "path";

const HASHABLE_EXTS = new Set([
  ".css",
  ".js",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

const CONTENT_ASSET_EXTS = new Set([
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
]);

const HASH_SUFFIX_PATTERN = /\.[a-f0-9]{8}$/i;

const FONT_EXTS = new Set([".woff", ".woff2", ".ttf", ".eot", ".otf"]);

type ContentAssetLookup = {
  byPath: Map<string, string>;
  byBasename: Map<string, string[]>;
};

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

/** Build a content-relative lookup for content assets. */
function buildContentAssetMap(contentDirs: string | string[]): ContentAssetLookup {
  const dirs = Array.isArray(contentDirs) ? contentDirs : [contentDirs];
  const byPath = new Map<string, string>();
  const byBasename = new Map<string, string[]>();
  for (const contentDir of dirs) {
    function walk(dir: string) {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        const ext = extname(entry.name);
        if (!CONTENT_ASSET_EXTS.has(ext)) continue;
        if (entry.name.endsWith(".inline.svg")) continue;
        const relPath = normalizePath(relative(contentDir, full));
        byPath.set(relPath, full);

        const existing = byBasename.get(entry.name);
        if (existing) {
          if (!existing.includes(relPath)) existing.push(relPath);
        } else {
          byBasename.set(entry.name, [relPath]);
        }
      }
    }
    walk(contentDir);
  }
  return { byPath, byBasename };
}

function computeHash(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 8);
}

/**
 * Strip unnecessary metadata from SVG content for the processed output.
 * Removes XML processing instructions, comments, editor metadata elements,
 * and unnecessary namespace declarations while preserving the visual output.
 */
function cleanSvgContent(content: Buffer): Buffer {
  let svg = content.toString("utf-8");

  // Remove XML processing instructions (<?xml ...?>)
  svg = svg.replace(/<\?xml[^?]*\?>\s*/gi, "");

  // Remove HTML comments (<!-- ... -->)
  svg = svg.replace(/<!--[\s\S]*?-->\s*/g, "");

  // Remove common editor metadata elements
  svg = svg.replace(/<metadata[\s\S]*?<\/metadata>\s*/gi, "");
  svg = svg.replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]*>)\s*/gi, "");
  svg = svg.replace(/<inkscape:[^>]*(?:\/>|>[\s\S]*?<\/inkscape:[^>]*>)\s*/gi, "");

  // Remove unnecessary namespace declarations from the root <svg> tag
  svg = svg.replace(
    /(<svg\b[^>]*?)\s+xmlns:(sodipodi|inkscape|dc|cc|rdf|sketch|illustrator)="[^"]*"/gi,
    "$1",
  );

  // Remove empty <defs></defs> blocks
  svg = svg.replace(/<defs\s*>\s*<\/defs>\s*/gi, "");

  // Collapse multiple newlines into one
  svg = svg.replace(/\n{3,}/g, "\n\n");

  return Buffer.from(svg.trim(), "utf-8");
}

function stripHashSuffix(name: string): string {
  return name.replace(HASH_SUFFIX_PATTERN, "");
}

function isHashedAssetFileName(fileName: string): boolean {
  const ext = extname(fileName);
  return HASH_SUFFIX_PATTERN.test(basename(fileName, ext));
}

function toLogicalAssetFileName(assetPath: string): string {
  const ext = extname(assetPath);
  const logicalName = `${stripHashSuffix(basename(assetPath, ext))}${ext}`;
  const assetDir = dirname(assetPath);
  return assetDir === "." ? logicalName : normalizePath(join(assetDir, logicalName));
}

function toHashedAssetFileName(assetPath: string, hash: string): string {
  const ext = extname(assetPath);
  return `${stripHashSuffix(basename(assetPath, ext))}.${hash}${ext}`;
}

/**
 * Same as `toHashedAssetFileName` but preserves the asset's directory
 * structure inside `assets/` (e.g. `fonts/foo.woff2` stays in `fonts/`).
 * Used for pre-existing bundle output (fonts, CSS-relative resources)
 * where the directory layout has meaning for url() resolution.
 */
function toHashedAssetPathPreservingDir(assetPath: string, hash: string): string {
  const hashedBase = toHashedAssetFileName(assetPath, hash);
  const assetDir = dirname(assetPath);
  return assetDir === "." ? hashedBase : normalizePath(join(assetDir, hashedBase));
}

function isExternalRef(ref: string): boolean {
  return (
    ref.startsWith("http:") ||
    ref.startsWith("https:") ||
    ref.startsWith("//") ||
    ref.startsWith("#") ||
    ref.startsWith("data:") ||
    ref.startsWith("mailto:")
  );
}

function resolveAssetReference(
  ref: string,
): { basePrefix: string; assetPath: string; suffix: string; isContentAsset: boolean } | undefined {
  const pathname = ref.split(/[?#]/u, 1)[0] ?? ref;
  const suffix = ref.slice(pathname.length);

  if (pathname.startsWith("./")) {
    const assetPath = normalizePath(pathname.slice(2));
    const ext = extname(pathname).toLowerCase();
    if (!CONTENT_ASSET_EXTS.has(ext)) return undefined;
    if (!assetPath) return undefined;
    return { basePrefix: "", assetPath, suffix, isContentAsset: true };
  }

  if (!pathname.startsWith("/")) return undefined;

  const marker = "/assets/";
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex < 0) return undefined;

  const basePrefix = pathname.slice(0, markerIndex);
  const assetPath = normalizePath(pathname.slice(markerIndex + marker.length));
  if (!assetPath || assetPath.startsWith("/")) return undefined;

  return {
    basePrefix,
    assetPath,
    suffix,
    isContentAsset: CONTENT_ASSET_EXTS.has(extname(assetPath).toLowerCase()),
  };
}

function toPublishedAssetUrl(basePrefix: string, assetPath: string): string {
  return `${basePrefix}/assets/${assetPath}`.replace(/^\/\//, "/");
}

function listAssetFiles(dir: string, prefix = ""): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relPath = prefix ? normalizePath(join(prefix, entry.name)) : entry.name;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listAssetFiles(fullPath, relPath));
      continue;
    }
    files.push(relPath);
  }

  return files;
}

/** Remove empty directories left behind after flattening asset files. */
function removeEmptyDirs(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    removeEmptyDirs(full);
    if (readdirSync(full).length === 0) {
      rmSync(full, { recursive: true, force: true });
    }
  }
}

function rewriteSrcsetValue(srcset: string, rewriteRef: (ref: string) => string): string {
  return srcset
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;
      const [ref, ...descriptor] = trimmed.split(/\s+/);
      const rewrittenRef = rewriteRef(ref);
      return [rewrittenRef, ...descriptor].join(" ");
    })
    .join(", ");
}

/**
 * Hash assets and rewrite HTML references.
 *
 * @param outDir - The dist output directory
 * @param contentDir - The content source directory (for finding referenced assets)
 */
export function hashAssets(outDir: string, contentDir: string | string[]): void {
  const assetsDir = join(outDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  const renames = new Map<string, string>();
  const contentAssets = buildContentAssetMap(contentDir);

  // Phase 1: Collect and hash pre-existing files in dist/assets/ (CSS, JS, fonts)
  const existing: Array<{ ext: string; full: string; isHashed: boolean; logicalFileName: string }> =
    listAssetFiles(assetsDir)
      .map((assetPath) => ({
        ext: extname(assetPath),
        full: join(assetsDir, assetPath),
        isHashed: isHashedAssetFileName(assetPath),
        logicalFileName: toLogicalAssetFileName(assetPath),
      }))
      .filter((asset) => HASHABLE_EXTS.has(asset.ext));

  // Process already-hashed files first so fresh unhashed copies from content rebuilds win.
  existing.sort((left, right) => Number(right.isHashed) - Number(left.isHashed));

  for (const file of existing) {
    let content: Buffer = readFileSync(file.full);

    // Clean SVG files: strip unnecessary metadata from processed output
    if (file.ext === ".svg") {
      content = cleanSvgContent(content);
    }

    const hash = computeHash(content);
    // Fonts keep their `fonts/` (or other) parent directory so CSS-relative
    // `url('fonts/x.woff2')` references in the bundled stylesheet still
    // resolve after hashing. Other pre-existing assets stay flattened for
    // historical compatibility (and to avoid basename collisions for
    // content assets that happen to share the same dist staging area).
    const hashedFileName = FONT_EXTS.has(file.ext)
      ? toHashedAssetPathPreservingDir(file.logicalFileName, hash)
      : toHashedAssetFileName(file.logicalFileName, hash);
    const hashedPath = join(assetsDir, hashedFileName);

    if (file.full !== hashedPath) {
      if (existsSync(hashedPath)) {
        rmSync(file.full, { force: true });
      } else if (file.ext === ".svg") {
        // Write cleaned content then rename (original may differ)
        writeFileSync(file.full, content);
        renameSync(file.full, hashedPath);
      } else {
        renameSync(file.full, hashedPath);
      }
    } else if (file.ext === ".svg") {
      // Same path but content was cleaned
      writeFileSync(file.full, content);
    }

    renames.set(file.logicalFileName, hashedFileName);
  }

  // Clean up empty subdirectories left after flattening
  removeEmptyDirs(assetsDir);

  // Phase 2: Scan HTML — resolve content assets on demand, rewrite all references
  const missingAssets: string[] = [];

  function rewriteAssetReference(ref: string): string {
    if (isExternalRef(ref)) return ref;

    const resolved = resolveAssetReference(ref);
    if (!resolved) return ref;

    const { assetPath, basePrefix, suffix, isContentAsset } = resolved;

    // Already hashed in phase 1 (CSS, JS, fonts) or a prior HTML file
    const already = renames.get(assetPath);
    if (already) {
      return `${toPublishedAssetUrl(basePrefix, already)}${suffix}`;
    }

    if (!isContentAsset) return ref;

    // Check dist/assets/ first (content assets already copied there)
    const distAsset = join(assetsDir, assetPath);
    const sourcePath = existsSync(distAsset)
      ? distAsset
      : (contentAssets.byPath.get(assetPath) ??
        (() => {
          const fileName = basename(assetPath);
          const candidates = contentAssets.byBasename.get(fileName);
          if (!candidates || candidates.length !== 1) return undefined;
          return contentAssets.byPath.get(candidates[0]);
        })());
    if (!sourcePath) {
      if (!missingAssets.includes(assetPath)) missingAssets.push(assetPath);
      return ref;
    }

    let content: Buffer = readFileSync(sourcePath);

    // Clean SVG files when copying to output
    if (extname(assetPath).toLowerCase() === ".svg") {
      content = cleanSvgContent(content);
    }

    const hash = computeHash(content);
    const hashedName = toHashedAssetFileName(assetPath, hash);
    const hashedDest = join(assetsDir, hashedName);

    if (!existsSync(hashedDest)) {
      writeFileSync(hashedDest, content);
    }

    renames.set(assetPath, hashedName);
    return `${toPublishedAssetUrl(basePrefix, hashedName)}${suffix}`;
  }

  /**
   * Rewrite a `url(...)` reference inside a CSS file at `cssDirRelToAssets`
   * (relative to `<outDir>/assets/`). Resolves the relative reference into an
   * `assets/...` logical path, looks it up in `renames`, and emits the
   * absolute hashed URL so the CSS works regardless of where the bundler
   * chose to emit the stylesheet.
   */
  function rewriteCssAssetReference(ref: string, cssDirRelToAssets: string): string {
    if (isExternalRef(ref)) return ref;

    const pathname = ref.split(/[?#]/u, 1)[0] ?? ref;
    const suffix = ref.slice(pathname.length);
    if (!pathname) return ref;

    // Absolute /assets/... → reuse the HTML pipeline.
    if (pathname.startsWith("/")) return rewriteAssetReference(ref);

    // Strip optional `./` prefix; treat any other prefix as opaque (e.g.
    // `data:`, fragment-only refs) so we don't accidentally rewrite them.
    const cleaned = pathname.replace(/^\.\//, "");
    if (cleaned.startsWith("..") || cleaned.includes(":")) return ref;

    const assetPath = cssDirRelToAssets
      ? normalizePath(`${cssDirRelToAssets}/${cleaned}`)
      : cleaned;
    const hashed = renames.get(assetPath);
    if (!hashed) return ref;

    // Use a relative URL pointing back to the hashed asset so the rewritten
    // CSS keeps working regardless of `basePath`.
    const cssDirSegments = cssDirRelToAssets ? cssDirRelToAssets.split("/").length : 0;
    const upPrefix = "../".repeat(cssDirSegments);
    return `${upPrefix}${hashed}${suffix}`;
  }

  function processHtml(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        processHtml(full);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;

      let html = readFileSync(full, "utf-8");

      html = html.replace(
        /\b(src|href)=("|')([^"']*)\2/g,
        (match, attr: string, quote: string, ref: string) => {
          const rewrittenRef = rewriteAssetReference(ref);
          return rewrittenRef === ref ? match : `${attr}=${quote}${rewrittenRef}${quote}`;
        },
      );
      html = html.replace(/\bsrcset=("|')([^"']*)\1/g, (match, quote: string, srcset: string) => {
        const rewrittenSrcset = rewriteSrcsetValue(srcset, rewriteAssetReference);
        return rewrittenSrcset === srcset ? match : `srcset=${quote}${rewrittenSrcset}${quote}`;
      });

      writeFileSync(full, html);
    }
  }
  processHtml(outDir);

  // Phase 3: Rewrite `url(...)` references in CSS files so @font-face / `url()`
  // refs land on the hashed asset names. CSS lives at `assets/<file>.<hash>.css`
  // and originally contains relative URLs like `url('fonts/foo.woff2')` or
  // `url('./bar.png')`. Resolve those relative to the CSS file's directory in
  // `assets/`, look the asset up in the same `renames` map the HTML rewriter
  // uses, and rewrite to the published hashed URL.
  function processCss(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        processCss(full);
        continue;
      }
      if (!entry.name.endsWith(".css")) continue;

      const css = readFileSync(full, "utf-8");
      const cssDirRelToAssets = normalizePath(relative(assetsDir, dirname(full)));
      const next = css.replace(
        /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
        (match, quote: string, ref: string) => {
          const rewritten = rewriteCssAssetReference(ref, cssDirRelToAssets);
          return rewritten === ref ? match : `url(${quote}${rewritten}${quote})`;
        },
      );
      if (next !== css) writeFileSync(full, next);
    }
  }
  processCss(assetsDir);

  if (missingAssets.length > 0) {
    throw new Error(
      `[pagesmith] ${missingAssets.length} referenced content asset(s) not found:\n` +
        missingAssets.map((a) => `  - /assets/${a}`).join("\n"),
    );
  }
}
