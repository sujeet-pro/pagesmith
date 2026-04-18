/**
 * Link validator — checks links in markdown content.
 *
 * Walks the shared MDAST for link/image nodes and:
 *  - Validates well-formed-ness of external URLs.
 *  - Resolves internal links against the containing file, or the configured
 *    `rootDir`/`basePath` for absolute site paths (e.g. `/guide/foo`).
 *  - Verifies that internal images exist on disk.
 *  - Optionally enforces a whitelist of internal link targets
 *    (e.g. "internal links must point to other README.md files").
 *  - Optionally fetches external URLs (links and images) to confirm a `2xx`
 *    response. This check is opt-in and bounded by concurrency + timeout.
 */

import { existsSync } from "fs";
import { dirname, extname, resolve } from "path";
import type { ValidationIssue } from "./schema-validator";
import type { ContentValidator, MdastNode, ResolvedValidatorContext } from "./types";

/** Extract plain text from a node's children. */
function getTextContent(node: MdastNode): string {
  // `text` and `inlineCode` nodes are the main carriers of user-visible
  // characters inside a link. Without inlineCode support, valid links like
  // `` [`npm install`](https://npmjs.com) `` would be flagged as empty.
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  // Linked images (e.g. `[![alt](img.svg)](https://example.com)`) are a
  // common, accessible pattern. Fold the image's alt text into the link's
  // visible-text surface so the link is not reported as empty.
  if (node.type === "image") return node.alt ?? "";
  if (node.children) return node.children.map(getTextContent).join("");
  return "";
}

type CollectedLink = {
  kind: "link" | "image";
  url: string;
  text: string;
  alt?: string;
  line?: number;
};

/** Walk MDAST tree, collecting link and image nodes. */
function collectLinks(node: MdastNode): CollectedLink[] {
  const links: CollectedLink[] = [];

  if ((node.type === "link" || node.type === "image") && node.url) {
    links.push({
      kind: node.type,
      url: node.url,
      text: node.type === "link" ? getTextContent(node) : "",
      alt: node.type === "image" ? node.alt : undefined,
      line: node.position?.start.line,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      links.push(...collectLinks(child));
    }
  }

  return links;
}

function isInternalLink(url: string): boolean {
  if (url.startsWith("#")) return false;
  if (url.startsWith("http://") || url.startsWith("https://")) return false;
  if (url.startsWith("//")) return false;
  if (url.startsWith("mailto:")) return false;
  if (url.startsWith("tel:")) return false;
  if (url.startsWith("data:")) return false;
  return true;
}

function isWellFormedUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function stripFragmentAndQuery(url: string): string {
  return url.split("#")[0]!.split("?")[0]!;
}

export type LinkValidatorOptions = {
  /**
   * URL prefixes or glob-like patterns to skip during internal/external link
   * validation. Useful for known-dynamic routes or generated links.
   */
  skipPatterns?: string[];

  /**
   * Absolute root directory used to resolve site-absolute URLs (paths that
   * start with `/`). When set, `/guide/foo` resolves to
   * `<rootDir>/guide/foo`. When unset, absolute paths cannot be verified and
   * are skipped.
   */
  rootDir?: string;

  /**
   * Site base path prefix (e.g. `/pagesmith`). When provided, it is stripped
   * from site-absolute URLs before resolving against `rootDir`.
   */
  basePath?: string;

  /**
   * Extra filesystem roots used to resolve site-absolute URLs. Each entry
   * maps a URL prefix to a directory. Any URL starting with `prefix` is
   * checked for existence under `dir` before the link is flagged as broken.
   *
   * Typical use: register `publicDir` at prefix `/`, and each docs
   * `assets[<prefix>]` entry at its configured prefix.
   */
  additionalRoots?: Array<{ prefix: string; dir: string }>;

  /**
   * Custom predicate for internal link targets. When provided and it returns
   * false, an error is reported. Invoked with the cleaned URL (no query /
   * fragment) and the resolved filesystem path.
   */
  allowInternalTarget?: (href: string, resolvedPath: string) => boolean;

  /**
   * When `true`, non-image internal links that do not resolve to a markdown
   * file (`.md`, `.mdx`, or any `README.md` / `index.md` in a directory) are
   * flagged as errors. Enforces the "internal links must be to other local
   * markdown" rule while still allowing image links and links to static
   * assets (which are reported through the image validator's channels).
   */
  internalLinksMustBeMarkdown?: boolean;

  /**
   * When `true`, every internal page link must be authored as a *relative*
   * path ending in `.md` or `.mdx` (for example `./relative/README.md`,
   * `./foo.md`, `../sibling/index.md`). Bare forms (`./foo`, `./foo/`) and
   * site-absolute URLs (`/guide/foo`) are rejected so the source form is
   * always an unambiguous, grep-able path to a real file on disk.
   *
   * Images, fragment-only hrefs, `mailto:`/`tel:`, external URLs, and any
   * URL matching `skipPatterns` / resolving under an `additionalRoots`
   * asset tree are exempt. The docs preset turns this on by default; the
   * core default stays `false` so third-party consumers are not broken.
   */
  requireCanonicalInternalLinks?: boolean;

  /**
   * When `true`, every image must carry non-empty alt text. Default: `true`.
   * Set to `false` to treat missing alt only as a warning (via the existing
   * accessibility channel).
   */
  requireAltText?: boolean;

  /**
   * When `true`, fail if the markdown contains a raw `<img>` HTML tag.
   * Authors should use the `![]()` Markdown syntax (or a MDX component) so
   * the image pipeline can rewrite URLs, hash filenames, and emit
   * theme-aware variants. Default: `true`.
   */
  forbidHtmlImgTag?: boolean;

  /**
   * When `true`, adjacent image references with `-light` / `-dark` filename
   * suffixes must appear as a matched pair. Missing or mis-ordered pairs
   * become errors so authors always ship both theme variants. Images with a
   * `.invert` class-style suffix are exempt and accepted as single entries.
   * Default: `true`.
   */
  requireThemeVariantPairs?: boolean;

  /**
   * When `true`, external (http/https) URLs are fetched and a non-2xx or
   * failing response becomes a warning/error. Off by default so local
   * validation stays fast and offline-friendly.
   */
  checkExternalReachability?: boolean;

  /**
   * Severity used when an external URL is unreachable (fetch fails or
   * response status is not `2xx`). Default: `'warn'`.
   */
  unreachableSeverity?: "warn" | "error";

  /** Request timeout (ms) when fetching external URLs. Default: 10000. */
  fetchTimeoutMs?: number;

  /**
   * Upper bound on the number of concurrent external URL requests from a
   * single validator invocation. Default: 8.
   */
  fetchConcurrency?: number;

  /**
   * Optional fetch implementation. Defaults to the global `fetch`. Accepts
   * `HEAD` requests and falls back to `GET` automatically when `HEAD` fails.
   */
  fetchImpl?: typeof fetch;
};

function shouldSkip(skipPatterns: string[], url: string): boolean {
  return skipPatterns.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(url);
    }
    return url.startsWith(pattern);
  });
}

/**
 * Suffixes tried against each resolved base path. Supports link targets
 * authored without their extension (typical for docs sites where
 * `guide/foo` maps to either `guide/foo.md` or `guide/foo/README.md`).
 *
 * The markdown variants appear first so that resolution prefers a concrete
 * markdown file over a matching directory (directories satisfy `existsSync`
 * but should not pass the `internalLinksMustBeMarkdown` check).
 */
const MARKDOWN_CANDIDATE_SUFFIXES = [
  ".md",
  ".mdx",
  "/README.md",
  "/README.mdx",
  "/index.md",
  "/index.mdx",
  "",
];

function expandCandidate(base: string): string[] {
  const candidates: string[] = [];
  for (const suffix of MARKDOWN_CANDIDATE_SUFFIXES) {
    candidates.push(`${base}${suffix}`);
  }
  return candidates;
}

/**
 * Resolve a non-external href to a list of candidate filesystem paths.
 * Returns an empty array when the href cannot be resolved locally (e.g. a
 * site-absolute URL with no `rootDir` and no matching additional root).
 *
 * The link validator treats the link as valid if *any* candidate exists on
 * disk so that sites with multiple passthrough roots (content + public +
 * asset mappings) validate cleanly.
 */
function resolveInternalCandidates(
  url: string,
  fileDir: string,
  rootDir: string | undefined,
  basePath: string | undefined,
  additionalRoots: Array<{ prefix: string; dir: string }>,
): string[] {
  const cleanPath = stripFragmentAndQuery(url);
  if (!cleanPath) return [];

  if (cleanPath.startsWith("/")) {
    let localPath = cleanPath;
    if (basePath) {
      const trimmedBase = basePath.replace(/\/+$/, "");
      if (trimmedBase && localPath.startsWith(`${trimmedBase}/`)) {
        localPath = localPath.slice(trimmedBase.length);
      } else if (trimmedBase && localPath === trimmedBase) {
        localPath = "/";
      }
    }
    const bases: string[] = [];
    if (rootDir) {
      bases.push(resolve(rootDir, `.${localPath}`));
    }
    for (const root of additionalRoots) {
      const prefix = root.prefix.endsWith("/") ? root.prefix : `${root.prefix}/`;
      const prefixedPath =
        localPath === root.prefix || localPath === `${root.prefix}/`
          ? "/"
          : localPath.startsWith(prefix)
            ? localPath.slice(prefix.length - 1)
            : localPath === "/" && root.prefix === "/"
              ? "/"
              : null;
      if (prefixedPath !== null) {
        bases.push(resolve(root.dir, `.${prefixedPath}`));
      }
    }
    const candidates: string[] = [];
    for (const base of bases) candidates.push(...expandCandidate(base));
    return candidates;
  }

  return expandCandidate(resolve(fileDir, cleanPath));
}

/**
 * Fetch a URL with a timeout. Tries HEAD first and falls back to GET when
 * HEAD returns a non-2xx status (some hosts reject HEAD requests).
 */
async function fetchStatus(
  url: string,
  opts: { timeoutMs: number; fetchImpl: typeof fetch },
): Promise<{ ok: boolean; status: number | null; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const resp = await opts.fetchImpl(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    if (resp.ok) return { ok: true, status: resp.status };

    // Some servers don't support HEAD; retry with GET.
    if ([400, 403, 404, 405, 501].includes(resp.status)) {
      const getResp = await opts.fetchImpl(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
      return { ok: getResp.ok, status: getResp.status };
    }

    return { ok: false, status: resp.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Map over a list with bounded concurrency so fetch-heavy validators do not
 * open hundreds of sockets at once.
 */
async function mapConcurrent<T, U>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<U>,
): Promise<U[]> {
  const results: U[] = Array.from({ length: items.length });
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
}

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);

function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTS.has(extname(filePath).toLowerCase());
}

/**
 * Parse a filename to classify theme-variant behavior. Returns:
 *   - `variant: 'light' | 'dark'` and the shared base when the filename
 *     matches `<base>-light.<ext>` / `<base>-dark.<ext>`.
 *   - `variant: 'invert'` for `<base>.invert.<ext>` assets that render in
 *     either theme via CSS filters.
 *   - `null` when the filename does not participate in theming.
 */
function classifyThemeVariant(
  url: string,
): { variant: "light" | "dark"; base: string; ext: string } | { variant: "invert" } | null {
  const clean = stripFragmentAndQuery(url);
  const ext = extname(clean);
  if (!ext) return null;
  const withoutExt = clean.slice(0, -ext.length);
  const segments = withoutExt.split(".");
  if (segments.length >= 2 && segments[segments.length - 1] === "invert") {
    return { variant: "invert" };
  }
  const lightMatch = /^(.+)-light$/.exec(withoutExt);
  if (lightMatch) return { variant: "light", base: lightMatch[1]!, ext };
  const darkMatch = /^(.+)-dark$/.exec(withoutExt);
  if (darkMatch) return { variant: "dark", base: darkMatch[1]!, ext };
  return null;
}

export function createLinkValidator(options?: LinkValidatorOptions): ContentValidator {
  const skipPatterns = options?.skipPatterns ?? [];
  const rootDir = options?.rootDir;
  const basePath = options?.basePath;
  const additionalRoots = options?.additionalRoots ?? [];
  const allowInternalTarget = options?.allowInternalTarget;
  const internalLinksMustBeMarkdown = options?.internalLinksMustBeMarkdown ?? false;
  const requireCanonicalInternalLinks = options?.requireCanonicalInternalLinks ?? false;
  const requireAltText = options?.requireAltText ?? true;
  const forbidHtmlImgTag = options?.forbidHtmlImgTag ?? true;
  const requireThemeVariantPairs = options?.requireThemeVariantPairs ?? true;
  const checkExternalReachability = options?.checkExternalReachability ?? false;
  const unreachableSeverity = options?.unreachableSeverity ?? "warn";
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? 10_000;
  const fetchConcurrency = options?.fetchConcurrency ?? 8;
  const fetchImpl = options?.fetchImpl ?? (globalThis.fetch as typeof fetch | undefined);

  return {
    name: "links",

    async validate(ctx: ResolvedValidatorContext): Promise<ValidationIssue[]> {
      if (!ctx.rawContent) return [];

      const issues: ValidationIssue[] = [];
      const tree = ctx.mdast as MdastNode;
      const links = collectLinks(tree);
      const fileDir = dirname(ctx.filePath);

      // ── Block-level structural checks on the raw source ──
      // Walk the MDAST for `html` nodes (raw HTML blocks/inline) that
      // introduce `<img>` tags. MDAST already excludes fenced code blocks
      // and inline code, so documentation examples that *show* an `<img>`
      // inside a fence are not falsely flagged. `<img>` wrapped in a
      // `<picture>` element is allowed because it is the canonical pattern
      // for theme-aware or format-aware responsive images.
      if (forbidHtmlImgTag) {
        const imgTagRe = /<img\b/gi;
        const checkHtmlChunk = (value: string, lineOffset: number): void => {
          // Remove every <picture>...</picture> block so inner <img> tags
          // are treated as part of the accepted theme-variant pattern.
          const withoutPictures = value.replace(/<picture\b[\s\S]*?<\/picture>/gi, (match) =>
            // Preserve newline count so reported line numbers stay accurate.
            "\n".repeat((match.match(/\n/g) ?? []).length),
          );
          imgTagRe.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = imgTagRe.exec(withoutPictures)) !== null) {
            const prefix = withoutPictures.slice(0, m.index);
            const line = lineOffset + prefix.split("\n").length - 1;
            issues.push({
              field: `images (line ${line})`,
              message:
                "Raw <img> HTML tag found outside a <picture> wrapper. Use Markdown image syntax `![alt](url)` (or wrap with <picture> for theme variants) so the image pipeline can rewrite URLs and emit theme variants.",
              severity: "error",
            });
          }
        };
        const walk = (node: MdastNode): void => {
          if ((node.type === "html" || node.type === "mdxJsxFlowElement") && node.value) {
            checkHtmlChunk(node.value, node.position?.start.line ?? 1);
          }
          if (node.children) {
            for (const child of node.children) walk(child);
          }
        };
        walk(tree);
      }

      // ── Theme-variant pair check (adjacent -light / -dark images) ──
      if (requireThemeVariantPairs) {
        const imageNodes = links.filter((l) => l.kind === "image");
        for (let i = 0; i < imageNodes.length; i += 1) {
          const current = imageNodes[i]!;
          const next = imageNodes[i + 1];
          const classification = classifyThemeVariant(current.url);
          if (!classification || classification.variant === "invert") continue;
          const partnerVariant = classification.variant === "light" ? "dark" : "light";
          const partnerBase = classification.base;
          const partnerExt = classification.ext;
          const lineInfo = current.line ? ` (line ${current.line})` : "";

          if (!next) {
            issues.push({
              field: `images${lineInfo}`,
              message: `Missing ${partnerVariant} partner for ${current.url} — expected an image with base "${partnerBase}${partnerExt === "" ? "" : partnerExt}" alongside it.`,
              severity: "error",
            });
            continue;
          }
          const nextClass = classifyThemeVariant(next.url);
          const partnerOk =
            nextClass &&
            "base" in nextClass &&
            nextClass.variant === partnerVariant &&
            nextClass.base === partnerBase &&
            nextClass.ext === partnerExt;
          if (!partnerOk) {
            issues.push({
              field: `images${lineInfo}`,
              message: `${classification.variant} image ${current.url} must be immediately followed by its ${partnerVariant} counterpart.`,
              severity: "error",
            });
          } else {
            // Skip the partner so we do not re-flag it as orphaned.
            i += 1;
          }
        }
      }

      // Collect external URLs for concurrent reachability checks later.
      const externalChecks: Array<{ link: CollectedLink; url: string }> = [];

      for (const link of links) {
        const lineInfo = link.line ? ` (line ${link.line})` : "";

        if (link.kind === "image" && requireAltText) {
          const alt = link.alt ?? "";
          if (!alt.trim()) {
            issues.push({
              field: `images${lineInfo}`,
              message: `Image is missing alt text: ${link.url}`,
              severity: "error",
            });
          }
        }

        if (link.kind === "link" && link.text !== undefined && !link.text.trim()) {
          issues.push({
            field: `links${lineInfo}`,
            message: `Link has no visible text: ${link.url}`,
            severity: "warn",
          });
        }

        if (shouldSkip(skipPatterns, link.url)) continue;

        // Canonical-form check runs before the resolver so bare `./foo` or
        // `/guide/foo` links are flagged even when they happen to resolve
        // (e.g. via `README.md` suffix expansion). Images are exempt
        // because they legitimately point at static assets that do not
        // have markdown extensions.
        if (
          link.kind === "link" &&
          requireCanonicalInternalLinks &&
          isInternalLink(link.url) &&
          !link.url.startsWith("#")
        ) {
          const cleanPath = stripFragmentAndQuery(link.url);
          const exemptByAssetRoot = additionalRoots.some((root) => {
            const prefix = root.prefix.endsWith("/") ? root.prefix : `${root.prefix}/`;
            return cleanPath === root.prefix || cleanPath.startsWith(prefix);
          });
          if (!exemptByAssetRoot) {
            const isRelative = cleanPath.startsWith("./") || cleanPath.startsWith("../");
            const endsWithMarkdown = /\.(?:md|mdx)$/i.test(cleanPath);
            if (!isRelative || !endsWithMarkdown) {
              issues.push({
                field: `links${lineInfo}`,
                message: `Non-canonical internal link: ${link.url}. Internal page links must be authored as a relative path ending in \`.md\` (for example \`./relative/README.md\`) so the target is a real, grep-able file on disk.`,
                severity: "error",
              });
              continue;
            }
          }
        }

        if (link.url.startsWith("http://") || link.url.startsWith("https://")) {
          if (!isWellFormedUrl(link.url)) {
            issues.push({
              field: `links${lineInfo}`,
              message: `Malformed external URL: ${link.url}`,
              severity: "warn",
            });
            continue;
          }
          if (checkExternalReachability && fetchImpl) {
            externalChecks.push({ link, url: link.url });
          }
          continue;
        }

        if (!isInternalLink(link.url)) continue;

        const candidates = resolveInternalCandidates(
          link.url,
          fileDir,
          rootDir,
          basePath,
          additionalRoots,
        );
        if (candidates.length === 0) continue;

        const resolved = candidates.find((candidate) => existsSync(candidate));
        if (!resolved) {
          issues.push({
            field: `${link.kind === "image" ? "images" : "links"}${lineInfo}`,
            message:
              link.kind === "image"
                ? `Missing local image: ${link.url}`
                : `Broken internal link: ${link.url}`,
            severity: "error",
          });
          continue;
        }

        if (link.kind === "link" && allowInternalTarget) {
          const cleanUrl = stripFragmentAndQuery(link.url);
          if (cleanUrl && !allowInternalTarget(cleanUrl, resolved)) {
            issues.push({
              field: `links${lineInfo}`,
              message: `Disallowed internal link target: ${link.url}`,
              severity: "error",
            });
          }
        }

        if (link.kind === "link" && internalLinksMustBeMarkdown) {
          // Links that resolve through a registered asset root (passthrough
          // URLs like `/llms.txt`, `/prompts/setup-core.md`, `/schemas/*`)
          // are intentionally non-page asset targets and must not trip
          // the "internal links must be markdown" rule.
          const cleanUrl = stripFragmentAndQuery(link.url);
          const isAssetRootLink =
            cleanUrl.startsWith("/") &&
            additionalRoots.some((root) => {
              const prefix = root.prefix.endsWith("/") ? root.prefix : `${root.prefix}/`;
              return cleanUrl === root.prefix || cleanUrl.startsWith(prefix);
            });
          if (!isAssetRootLink && !isMarkdownFile(resolved)) {
            issues.push({
              field: `links${lineInfo}`,
              message: `Internal link must point to a markdown file (got ${extname(resolved) || "no-extension"}): ${link.url}`,
              severity: "error",
            });
          }
        }
      }

      if (externalChecks.length > 0 && fetchImpl) {
        const statuses = await mapConcurrent(externalChecks, fetchConcurrency, async (entry) => {
          return fetchStatus(entry.url, { timeoutMs: fetchTimeoutMs, fetchImpl });
        });
        for (let i = 0; i < externalChecks.length; i += 1) {
          const entry = externalChecks[i]!;
          const status = statuses[i]!;
          if (status.ok) continue;
          const lineInfo = entry.link.line ? ` (line ${entry.link.line})` : "";
          const detail = status.status
            ? `status ${status.status}`
            : `error ${status.error ?? "fetch failed"}`;
          issues.push({
            field: `${entry.link.kind === "image" ? "images" : "links"}${lineInfo}`,
            message: `${entry.link.kind === "image" ? "Hosted image" : "External URL"} unreachable (${detail}): ${entry.url}`,
            severity: unreachableSeverity,
          });
        }
      }

      return issues;
    },
  };
}

export const linkValidator: ContentValidator = createLinkValidator();
