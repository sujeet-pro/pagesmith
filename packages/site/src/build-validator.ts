/**
 * Post-build output validator.
 *
 * Walks a static site output directory and verifies:
 *  - Internal links and image sources resolve to existing files.
 *  - `srcset` entries all resolve.
 *  - Every image below `<outDir>/assets/` carries a content-hash in its name
 *    (e.g. `foo.1a2b3c4d.png`). This check is opt-out via `requireAssetHash`.
 *  - SVG files are well-formed (`<svg>` present, no parser error markers).
 *  - Optional: raster images declared inside `<picture>` elements provide
 *    modern formats (webp + avif) as additional `<source>` entries.
 *  - Optional: `<picture>` elements annotated as "themed" expose both a
 *    light and a dark variant source.
 *
 * Designed for use after `hashAssets()` runs so all images should already
 * have hashed filenames. Accepts trailing-slash and `basePath` settings to
 * correctly resolve HTML file locations.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, dirname, extname, join, relative } from "path";

// ── Types ──

export type BuildValidatorOptions = {
  /** Absolute path to the build output directory to validate. */
  outDir: string;
  /** Base path prefix used in URLs (e.g. "/pagesmith"). Default: "" */
  basePath?: string;
  /** Whether the build uses trailing slashes (path/index.html vs path.html). Default: false */
  trailingSlash?: boolean;
  /** Directory names to exclude from validation (e.g. ["examples", "pagefind"]). Default: ["pagefind"] */
  exclude?: string[];
  /**
   * When true, every raster image referenced from an `<img>` inside a
   * `<picture>` element must be accompanied by matching webp and avif
   * sources in the same `<picture>`. Default: false.
   */
  requireRasterModernFormats?: boolean;
  /**
   * When true, every `<picture>` element flagged as themed (either via the
   * `ps-figure-themed` class on the enclosing figure or via a
   * `media="(prefers-color-scheme: ...)"` source) must expose both a light
   * and a dark variant source. Default: false.
   */
  requireThemeVariants?: boolean;
  /**
   * Whether files in the `assets/` directory must have a content hash.
   * Default: true.
   */
  requireAssetHash?: boolean;
  /**
   * When true, every `<a href="#id">` within an HTML file must correspond to
   * an element with `id="id"` on the same page. Catches broken TOC and
   * "on this page" links. Default: false.
   */
  checkInPageAnchors?: boolean;
  /**
   * File names (relative to `outDir`) that must exist after build. Useful
   * for docs sites that need `favicon.svg`, `sitemap.xml`, `robots.txt`,
   * `llms.txt`, `llms-full.txt`, etc. Any file missing is flagged as an
   * error. Default: `[]`.
   *
   * Each entry may be a single filename, an array of alternatives (any one
   * is enough — e.g. `['favicon.svg', 'favicon.ico']`), or a string with
   * `|`-separated alternatives.
   */
  requiredFiles?: Array<string | string[]>;
  /**
   * When true, every canonical page (html file) must have both trailing
   * forms available — `path.html` *and* `path/index.html`. The missing
   * variant is typically emitted as a redirect. Default: false.
   */
  requireBothTrailingSlashForms?: boolean;
  /**
   * When true, cross-check `sitemap.xml` against the emitted HTML: every
   * sitemap `<loc>` must resolve to an emitted HTML file (error if not), and
   * every indexable HTML page (non-redirect, excluding `404.html`) must
   * appear in the sitemap (warning if not). No-op when `sitemap.xml` is
   * absent. Default: false.
   */
  checkSitemap?: boolean;
  /**
   * When true, verify the entry `index.html` references at least one bundled
   * CSS asset and one bundled JS asset, and that each referenced bundle
   * resolves on disk. Catches empty or broken production bundles. Default:
   * false.
   */
  checkBundledAssets?: boolean;
};

export type BuildValidationIssue = {
  file: string;
  message: string;
  severity: "error" | "warn";
};

export type BuildValidationResult = {
  errors: BuildValidationIssue[];
  warnings: BuildValidationIssue[];
  htmlFileCount: number;
  imageFileCount: number;
  passed: boolean;
};

// ── Constants ──

const HASH_SUFFIX_PATTERN = /\.[a-f0-9]{8}\.[^.]+$/i;

const IMAGE_EXTS = new Set([".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico"]);

const RASTER_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif"]);

const EXTERNAL_PATTERN = /^(https?:|\/\/|#|data:|mailto:|tel:|javascript:|blob:)/i;

const SVG_ERROR_PATTERNS = [/<parsererror[\s>]/i, /Syntax error/i, /<error[\s>]/i];

const DEFAULT_EXCLUDE = ["pagefind"];

// ── Helpers ──

/**
 * Return true if an href resolves into a top-level directory listed in the
 * build-validator's `exclude` set. Used to skip links into subsites that
 * are assembled outside this build (for example `/pagesmith/examples/*`
 * when the docs-only build excludes `examples/`).
 */
function refResolvesIntoExcludedDir(
  ref: string,
  basePath: string,
  excludeDirs: Set<string>,
): boolean {
  if (!ref.startsWith("/")) return false;
  const clean = ref.split("#")[0]!.split("?")[0]!;
  let path = clean;
  if (basePath && path.startsWith(`${basePath}/`)) path = path.slice(basePath.length);
  else if (basePath && path === basePath) return false;
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  return excludeDirs.has(segments[0]!);
}

function walkFiles(dir: string, ext?: string, excludeDirs?: Set<string>): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (excludeDirs?.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, ext, excludeDirs));
    } else if (!ext || extname(entry.name) === ext) {
      results.push(full);
    }
  }
  return results;
}

function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isExternal(href: string): boolean {
  return EXTERNAL_PATTERN.test(href);
}

function stripQueryHash(href: string): string {
  return href.split(/[?#]/)[0] ?? href;
}

function stripCodeContent(html: string): string {
  return html.replace(/<(pre|code)[\s>][\s\S]*?<\/\1>/gi, "");
}

function isRedirect(content: string): boolean {
  return /http-equiv=["']?refresh["']?/i.test(content);
}

function hasContentHash(fileName: string): boolean {
  return HASH_SUFFIX_PATTERN.test(fileName);
}

function isImageFile(path: string): boolean {
  return IMAGE_EXTS.has(extname(path).toLowerCase());
}

function isRasterExt(ext: string): boolean {
  return RASTER_EXTS.has(ext.toLowerCase());
}

/**
 * Resolve a local href to an absolute filesystem path within the output
 * directory. Returns `null` for external/anchor/data URLs.
 */
function resolveLocalHref(
  href: string,
  htmlFile: string,
  outDir: string,
  basePath: string,
): string | null {
  if (isExternal(href)) return null;
  if (href.trim() === "") return null;

  const clean = stripQueryHash(href);
  if (!clean) return null;

  if (clean.startsWith("/")) {
    let local = clean;
    if (basePath && local.startsWith(basePath + "/")) {
      local = local.slice(basePath.length);
    } else if (basePath && local === basePath) {
      local = "/";
    }
    return join(outDir, local);
  }

  return join(dirname(htmlFile), clean);
}

/**
 * Check whether a resolved path corresponds to an existing file. Handles
 * both trailing-slash (path/index.html) and flat (path.html) modes.
 */
function resolvedPathExists(resolved: string, trailingSlash: boolean): boolean {
  if (fileExists(resolved)) return true;
  if (fileExists(join(resolved, "index.html"))) return true;
  if (!trailingSlash && !extname(resolved) && fileExists(`${resolved}.html`)) return true;
  return false;
}

function validateSvgContent(content: string, relPath: string): BuildValidationIssue[] {
  const issues: BuildValidationIssue[] = [];

  if (!/<svg[\s>]/i.test(content)) {
    issues.push({
      file: relPath,
      message: "SVG file does not contain an <svg> element",
      severity: "error",
    });
    return issues;
  }

  for (const pattern of SVG_ERROR_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        file: relPath,
        message: `SVG file contains error marker: ${pattern.source}`,
        severity: "error",
      });
    }
  }

  return issues;
}

// ── <picture> helpers ──

type ParsedSource = {
  srcset: string;
  type?: string;
  media?: string;
  scheme?: string;
};

type ParsedPicture = {
  raw: string;
  sources: ParsedSource[];
  imgSrc: string | null;
  isThemed: boolean;
};

const PICTURE_RE = /<picture\b[^>]*>([\s\S]*?)<\/picture>/gi;
const SOURCE_RE = /<source\b([^>]*)>/gi;
const IMG_SRC_RE = /<img\b[^>]*\bsrc=(["'])([^"']*)\1/i;
const ATTR_RE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    attrs[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return attrs;
}

function parsePictures(html: string): ParsedPicture[] {
  const pictures: ParsedPicture[] = [];
  let m: RegExpExecArray | null;
  PICTURE_RE.lastIndex = 0;
  while ((m = PICTURE_RE.exec(html)) !== null) {
    const raw = m[0]!;
    const body = m[1]!;
    const sources: ParsedSource[] = [];
    let sm: RegExpExecArray | null;
    SOURCE_RE.lastIndex = 0;
    while ((sm = SOURCE_RE.exec(body)) !== null) {
      const attrs = parseAttrs(sm[1]!);
      if (!attrs.srcset) continue;
      sources.push({
        srcset: attrs.srcset,
        type: attrs.type,
        media: attrs.media,
        scheme: attrs["data-scheme"],
      });
    }
    const imgMatch = IMG_SRC_RE.exec(body);
    pictures.push({
      raw,
      sources,
      imgSrc: imgMatch?.[2] ?? null,
      isThemed:
        /ps-figure-themed/.test(raw) ||
        sources.some((s) => /prefers-color-scheme/.test(s.media ?? "")) ||
        sources.some((s) => s.scheme != null),
    });
  }
  return pictures;
}

function pickFirstSrc(srcset: string): string | null {
  const entry = srcset.split(",")[0]?.trim();
  if (!entry) return null;
  const src = entry.split(/\s+/)[0];
  return src ?? null;
}

/** Collect all `id="..."` attributes from an HTML string. */
function collectIds(html: string): Set<string> {
  const ids = new Set<string>();
  const re = /\bid=(["'])([^"']+)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    ids.add(m[2]!);
  }
  // href="#top" is special-cased by browsers and always valid.
  ids.add("top");
  return ids;
}

// ── Bundled-asset + sitemap consistency ──

/**
 * Verify the entry `index.html` references bundled CSS and JS, and that each
 * referenced bundle resolves on disk. Ported from the standalone
 * `validate-dist` script's bundled-asset discovery.
 */
function checkBundledAssetRefs(
  outDir: string,
  basePath: string,
  trailingSlash: boolean,
): BuildValidationIssue[] {
  const issues: BuildValidationIssue[] = [];
  const entryHtmlPath = join(outDir, "index.html");
  if (!fileExists(entryHtmlPath)) return issues;

  const html = readFileSync(entryHtmlPath, "utf-8");
  const assetRefs = Array.from(
    // The `.css`/`.js` extension may be followed by a query string or fragment
    // (`style.css?v=1`, `app.js#x`); capture those suffixes too so hashed/
    // cache-busted bundle refs are discovered rather than silently skipped.
    html.matchAll(/\b(?:href|src)=["']([^"']+\.(?:css|js)(?:[?#][^"']*)?)["']/gi),
    (m) => m[1]!,
  );
  const cssRefs = assetRefs.filter((ref) => /\.css(?:[?#].*)?$/i.test(ref));
  const jsRefs = assetRefs.filter((ref) => /\.js(?:[?#].*)?$/i.test(ref));

  if (cssRefs.length === 0) {
    issues.push({
      file: "index.html",
      message: "No bundled CSS asset discovered",
      severity: "error",
    });
  }
  if (jsRefs.length === 0) {
    issues.push({
      file: "index.html",
      message: "No bundled JS asset discovered",
      severity: "error",
    });
  }

  for (const ref of [...cssRefs, ...jsRefs]) {
    const resolved = resolveLocalHref(ref, entryHtmlPath, outDir, basePath);
    if (!resolved) continue;
    if (!resolvedPathExists(resolved, trailingSlash)) {
      issues.push({
        file: "index.html",
        message: `Bundled asset missing: ${ref}`,
        severity: "error",
      });
    }
  }

  return issues;
}

/**
 * Cross-check `sitemap.xml` against emitted HTML files: every sitemap
 * `<loc>` must resolve to a file, and every indexable HTML page must appear
 * in the sitemap. Ported from the standalone `validate-dist` script.
 */
function checkSitemapConsistency(
  outDir: string,
  basePath: string,
  htmlFiles: Map<string, string>,
): BuildValidationIssue[] {
  const issues: BuildValidationIssue[] = [];
  const sitemapPath = join(outDir, "sitemap.xml");
  if (!fileExists(sitemapPath)) return issues;

  const sitemap = readFileSync(sitemapPath, "utf-8");
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  const sitemapPaths = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = locPattern.exec(sitemap)) !== null) {
    const loc = m[1]!;
    try {
      const parsed = new URL(loc);
      let p = parsed.pathname.replace(/\/+$/, "") || "/";
      if (basePath && p.startsWith(basePath)) {
        p = p.slice(basePath.length) || "/";
      }
      sitemapPaths.add(p);
    } catch {
      issues.push({ file: "sitemap.xml", message: `Invalid URL: ${loc}`, severity: "warn" });
    }
  }

  for (const p of sitemapPaths) {
    const indexPath = p === "/" ? join(outDir, "index.html") : join(outDir, p, "index.html");
    const flatPath = p === "/" ? null : join(outDir, `${p}.html`);
    if (!fileExists(indexPath) && !(flatPath && fileExists(flatPath))) {
      issues.push({
        file: "sitemap.xml",
        message: `No file for sitemap entry: ${p}`,
        severity: "error",
      });
    }
  }

  const notFoundPath = join(outDir, "404.html");
  for (const [path, content] of htmlFiles) {
    if (isRedirect(content)) continue;
    if (path === notFoundPath) continue;
    const rel = relative(outDir, path);
    const slug =
      rel === "index.html" ? "/" : "/" + rel.replace(/\/index\.html$/, "").replace(/\.html$/, "");
    if (!sitemapPaths.has(slug)) {
      issues.push({ file: rel, message: `HTML file not in sitemap: ${slug}`, severity: "warn" });
    }
  }

  return issues;
}

// ── Main validator ──

/**
 * Validate a static site build output directory.
 *
 * Checks internal links, image sources, asset hashes, SVG validity, and
 * optionally enforces modern raster image formats + theme variants.
 */
export function validateBuildOutput(options: BuildValidatorOptions): BuildValidationResult {
  const {
    outDir,
    basePath: rawBasePath,
    trailingSlash = false,
    exclude,
    requireRasterModernFormats = false,
    requireThemeVariants = false,
    requireAssetHash = true,
    checkInPageAnchors = false,
    requiredFiles = [],
    requireBothTrailingSlashForms = false,
    checkSitemap = false,
    checkBundledAssets = false,
  } = options;

  const basePath = rawBasePath?.replace(/\/+$/, "") ?? "";
  const excludeDirs = new Set([...DEFAULT_EXCLUDE, ...(exclude ?? [])]);

  const errors: BuildValidationIssue[] = [];
  const warnings: BuildValidationIssue[] = [];

  if (!existsSync(outDir)) {
    errors.push({
      file: outDir,
      message: "Build output directory does not exist",
      severity: "error",
    });
    return { errors, warnings, htmlFileCount: 0, imageFileCount: 0, passed: false };
  }

  const htmlPaths = walkFiles(outDir, ".html", excludeDirs);
  const htmlFiles = new Map<string, string>();
  for (const p of htmlPaths) {
    htmlFiles.set(p, readFileSync(p, "utf-8"));
  }

  const allFiles = walkFiles(outDir, undefined, excludeDirs);
  const imageFiles = allFiles.filter((f) => isImageFile(f));

  const assetsDir = join(outDir, "assets");

  for (const [htmlPath, content] of htmlFiles) {
    if (isRedirect(content)) continue;
    const rel = relative(outDir, htmlPath);
    const stripped = stripCodeContent(content);

    // Collect all IDs for in-page anchor validation.
    const pageIds = checkInPageAnchors ? collectIds(stripped) : null;

    // href/src attribute checks ────────────────────────────────────────────
    const refPattern = /\b(href|src)=(["'])([^"']*)\2/gi;
    let match: RegExpExecArray | null;
    while ((match = refPattern.exec(stripped)) !== null) {
      const attr = match[1]!;
      const ref = match[3]!;

      if (ref === "..." || ref === "…" || ref === "") continue;

      // In-page anchor (href="#foo") validation.
      if (attr === "href" && ref.startsWith("#")) {
        if (checkInPageAnchors && pageIds) {
          const id = ref.slice(1);
          if (id && !pageIds.has(id)) {
            errors.push({
              file: rel,
              message: `Broken in-page anchor: ${ref}`,
              severity: "error",
            });
          }
        }
        continue;
      }

      if (isExternal(ref)) continue;

      // Refs that resolve into an excluded top-level directory are assumed
      // to be assembled from a sibling build (e.g. `/pagesmith/examples/*`
      // when examples/ is excluded from this validator). Skip them so
      // docs-only builds don't false-trip on hrefs into subsites.
      if (refResolvesIntoExcludedDir(ref, basePath, excludeDirs)) continue;

      const resolved = resolveLocalHref(ref, htmlPath, outDir, basePath);
      if (!resolved) continue;

      if (!resolvedPathExists(resolved, trailingSlash)) {
        const cleanRef = stripQueryHash(ref);
        const assetBasename = basename(cleanRef);
        if (existsSync(assetsDir) && fileExists(join(assetsDir, assetBasename))) {
          warnings.push({
            file: rel,
            message: `Asset path mismatch: ${ref} (exists in assets/ as ${assetBasename})`,
            severity: "warn",
          });
        } else {
          errors.push({
            file: rel,
            message: `Broken ${attr}: ${ref}`,
            severity: "error",
          });
        }
      }
    }

    // srcset checks ────────────────────────────────────────────────────────
    const srcsetPattern = /\bsrcset=(["'])([^"']*)\1/gi;
    while ((match = srcsetPattern.exec(stripped)) !== null) {
      const srcset = match[2]!;
      for (const entry of srcset.split(",")) {
        const trimmed = entry.trim();
        if (!trimmed) continue;
        const [ref] = trimmed.split(/\s+/);
        if (!ref || isExternal(ref)) continue;

        const resolved = resolveLocalHref(ref, htmlPath, outDir, basePath);
        if (!resolved) continue;

        if (!resolvedPathExists(resolved, trailingSlash)) {
          errors.push({
            file: rel,
            message: `Broken srcset entry: ${ref}`,
            severity: "error",
          });
        }
      }
    }

    // <picture> checks ─────────────────────────────────────────────────────
    if (requireRasterModernFormats || requireThemeVariants) {
      const pictures = parsePictures(stripped);
      for (const pic of pictures) {
        const fallbackSrc = pic.imgSrc;
        const fallbackExt = fallbackSrc ? extname(stripQueryHash(fallbackSrc)).toLowerCase() : "";

        if (requireRasterModernFormats && fallbackSrc && isRasterExt(fallbackExt)) {
          const types = new Set(
            pic.sources.map((s) => s.type?.toLowerCase()).filter(Boolean) as string[],
          );
          if (!types.has("image/webp")) {
            warnings.push({
              file: rel,
              message: `<picture> with raster fallback is missing a webp <source>: ${fallbackSrc}`,
              severity: "warn",
            });
          }
          if (!types.has("image/avif")) {
            warnings.push({
              file: rel,
              message: `<picture> with raster fallback is missing an avif <source>: ${fallbackSrc}`,
              severity: "warn",
            });
          }
        }

        if (requireThemeVariants && pic.isThemed) {
          const schemes = new Set<string>();
          for (const source of pic.sources) {
            if (source.scheme) {
              schemes.add(source.scheme.toLowerCase());
              continue;
            }
            const media = source.media ?? "";
            if (/prefers-color-scheme:\s*dark/i.test(media)) schemes.add("dark");
            else if (/prefers-color-scheme:\s*light/i.test(media)) schemes.add("light");
          }
          // The `<img>` element acts as the default fallback when no media
          // query matches. Convention used across the Pagesmith ecosystem:
          //   <picture>
          //     <source media="(prefers-color-scheme: dark)" srcset="x-dark">
          //     <img src="x-light">
          //   </picture>
          // Infer the fallback's variant from its filename (`-light` /
          // `.light` / `-dark` / `.dark`) so the missing-variant check
          // accepts that pattern without needing an explicit `<source>` for
          // the light variant.
          if (fallbackSrc) {
            if (/-light\b|\.light\b/i.test(fallbackSrc)) schemes.add("light");
            if (/-dark\b|\.dark\b/i.test(fallbackSrc)) schemes.add("dark");
          }
          const hasLight = schemes.has("light");
          const hasDark = schemes.has("dark");
          if (!hasDark) {
            warnings.push({
              file: rel,
              message: `Themed <picture> is missing a dark variant (${fallbackSrc ?? "<unknown>"})`,
              severity: "warn",
            });
          }
          if (!hasLight) {
            warnings.push({
              file: rel,
              message: `Themed <picture> is missing a light variant (${fallbackSrc ?? "<unknown>"})`,
              severity: "warn",
            });
          }
          // Verify every <source> srcset resolves to a file on disk.
          for (const source of pic.sources) {
            const first = pickFirstSrc(source.srcset);
            if (!first || isExternal(first)) continue;
            const resolved = resolveLocalHref(first, htmlPath, outDir, basePath);
            if (!resolved) continue;
            if (!resolvedPathExists(resolved, trailingSlash)) {
              errors.push({
                file: rel,
                message: `Themed <picture> source missing on disk: ${first}`,
                severity: "error",
              });
            }
          }
        }
      }
    }
  }

  // Asset hash check ───────────────────────────────────────────────────────
  if (requireAssetHash && existsSync(assetsDir)) {
    const assetImages = walkFiles(assetsDir).filter((f) => isImageFile(f));
    for (const imgPath of assetImages) {
      const fileName = basename(imgPath);
      if (!hasContentHash(fileName)) {
        errors.push({
          file: relative(outDir, imgPath),
          message: `Image in assets/ missing content hash: ${fileName}`,
          severity: "error",
        });
      }
    }
  }

  // SVG validity check ─────────────────────────────────────────────────────
  for (const imgPath of imageFiles) {
    if (extname(imgPath).toLowerCase() !== ".svg") continue;
    const content = readFileSync(imgPath, "utf-8");
    const rel = relative(outDir, imgPath);
    const svgIssues = validateSvgContent(content, rel);
    for (const issue of svgIssues) {
      if (issue.severity === "error") {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  // Required-file presence check ───────────────────────────────────────────
  for (const entry of requiredFiles) {
    const alternatives = typeof entry === "string" ? entry.split("|").map((s) => s.trim()) : entry;
    const exists = alternatives.some((name) => fileExists(join(outDir, name)));
    if (!exists) {
      errors.push({
        file: relative(outDir, outDir) || ".",
        message: `Required file missing: ${alternatives.join(" | ")}`,
        severity: "error",
      });
    }
  }

  // Both-trailing-slash-forms check ────────────────────────────────────────
  if (requireBothTrailingSlashForms) {
    const htmlSet = new Set(htmlPaths);
    for (const htmlPath of htmlPaths) {
      const rel = relative(outDir, htmlPath);
      if (rel === "index.html" || rel.endsWith("/index.html")) {
        // expect sibling flat file: parent/index.html → parent.html
        const parent = dirname(htmlPath);
        const base = basename(parent);
        if (!base) continue;
        const flat = join(dirname(parent), `${base}.html`);
        if (!htmlSet.has(flat)) {
          warnings.push({
            file: rel,
            message: `Missing flat alternative (${relative(outDir, flat)}) — serve one as redirect for trailing-slash neutrality.`,
            severity: "warn",
          });
        }
      } else {
        // flat file: expect a folder/index.html sibling
        const name = basename(htmlPath, ".html");
        if (name === "index") continue;
        const folderIndex = join(dirname(htmlPath), name, "index.html");
        if (!htmlSet.has(folderIndex)) {
          warnings.push({
            file: rel,
            message: `Missing trailing-slash alternative (${relative(outDir, folderIndex)}) — serve one as redirect for trailing-slash neutrality.`,
            severity: "warn",
          });
        }
      }
    }
  }

  // Bundled-asset discovery ────────────────────────────────────────────────
  if (checkBundledAssets) {
    for (const issue of checkBundledAssetRefs(outDir, basePath, trailingSlash)) {
      (issue.severity === "error" ? errors : warnings).push(issue);
    }
  }

  // Sitemap ↔ HTML consistency ──────────────────────────────────────────────
  if (checkSitemap) {
    for (const issue of checkSitemapConsistency(outDir, basePath, htmlFiles)) {
      (issue.severity === "error" ? errors : warnings).push(issue);
    }
  }

  return {
    errors,
    warnings,
    htmlFileCount: htmlFiles.size,
    imageFileCount: imageFiles.length,
    passed: errors.length === 0,
  };
}

/**
 * Run build validation and print results to console.
 * Returns the process exit code (0 = pass, 1 = fail).
 */
export function runBuildValidation(options: BuildValidatorOptions): number {
  const {
    outDir,
    basePath,
    trailingSlash,
    exclude,
    requireRasterModernFormats,
    requireThemeVariants,
    requireAssetHash,
    checkInPageAnchors,
    requiredFiles,
    requireBothTrailingSlashForms,
    checkSitemap,
    checkBundledAssets,
  } = options;

  console.info(`Validating build output: ${outDir}`);
  if (basePath) console.info(`  basePath: ${basePath}`);
  console.info(`  trailingSlash: ${trailingSlash ?? false}`);
  if (requireRasterModernFormats) console.info(`  requireRasterModernFormats: true`);
  if (requireThemeVariants) console.info(`  requireThemeVariants: true`);
  if (checkInPageAnchors) console.info(`  checkInPageAnchors: true`);
  if (requireBothTrailingSlashForms) console.info(`  requireBothTrailingSlashForms: true`);
  if (checkSitemap) console.info(`  checkSitemap: true`);
  if (checkBundledAssets) console.info(`  checkBundledAssets: true`);
  if (requireAssetHash === false) console.info(`  requireAssetHash: false`);
  if (requiredFiles && requiredFiles.length > 0) {
    console.info(
      `  requiredFiles: ${requiredFiles.length} entr${requiredFiles.length === 1 ? "y" : "ies"}`,
    );
  }
  const allExclude = [...DEFAULT_EXCLUDE, ...(exclude ?? [])];
  if (allExclude.length > 0) console.info(`  exclude: ${allExclude.join(", ")}`);

  const result = validateBuildOutput(options);

  console.info(`  HTML files: ${result.htmlFileCount}`);
  console.info(`  Image files: ${result.imageFileCount}`);

  if (result.warnings.length > 0) {
    console.warn(`\n${result.warnings.length} warning(s):`);
    for (const w of result.warnings) {
      console.warn(`  \u26A0 ${w.file}: ${w.message}`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`\n${result.errors.length} error(s):`);
    for (const e of result.errors) {
      console.error(`  \u2717 ${e.file}: ${e.message}`);
    }
  }

  console.info(
    `\nBuild validation: ${result.errors.length} errors, ${result.warnings.length} warnings`,
  );

  return result.passed ? 0 : 1;
}
