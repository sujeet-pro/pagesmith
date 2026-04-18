/**
 * Image structure validator — enforces the canonical HTML shape Pagesmith
 * emits (and accepts) for author-written image markup.
 *
 * The shape is:
 *
 *     <figure>
 *       <picture>
 *         <source ... />*       (zero or more <source> entries)
 *         <img ... />            (exactly one <img>)
 *       </picture>
 *       <figcaption> ... </figcaption>?   (optional)
 *     </figure>
 *
 * Or, for single-format assets that don't need responsive format fallbacks
 * (e.g. SVG, GIF), the `<picture>` layer may be omitted:
 *
 *     <figure>
 *       <img ... />
 *       <figcaption> ... </figcaption>?
 *     </figure>
 *
 * Validator checks against invalid markup authors have produced in
 * downstream repos (notably a `<figure>` nested *inside* `<picture>`, which
 * collapses theme-source fallbacks in every browser):
 *
 *   - No `<figure>` inside `<picture>`
 *   - No wrapping elements other than `<source>` / `<img>` (or comments)
 *     directly inside `<picture>`
 *   - Every `<picture>` contains at least one `<img>`
 *   - Every `<picture>` has at most one `<img>`
 *   - No unclosed `<picture>` (open-tag / close-tag count must match)
 *
 * Validation walks `html` MDAST nodes so fenced code blocks and inline code
 * (which legitimately *show* picture markup as documentation) are ignored.
 */

import type { ValidationIssue } from "./schema-validator";
import type { ContentValidator, MdastNode, ResolvedValidatorContext } from "./types";

const PICTURE_BLOCK_RE = /<picture\b[^>]*>([\s\S]*?)<\/picture\s*>/gi;
const PICTURE_OPEN_RE = /<picture\b/gi;
const PICTURE_CLOSE_RE = /<\/picture\b/gi;
const FIGURE_IN_PICTURE_RE = /<figure\b/i;
const IMG_IN_PICTURE_RE = /<img\b/gi;
const ALLOWED_IN_PICTURE_RE = /<(?!\/?(?:source|img)\b)\/?([a-z][a-z0-9-]*)\b/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
// Fenced code blocks and inline code legitimately *show* `<picture>` markup
// as documentation. Strip them from the raw-content sweep so author examples
// are not reported as structural violations.
const FENCED_CODE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;

/**
 * Count newlines up to a given offset so the reported line number matches
 * the source markdown rather than the start of the raw HTML block.
 */
function offsetToLine(text: string, offset: number, base: number): number {
  let line = base;
  for (let i = 0; i < offset; i += 1) if (text.charCodeAt(i) === 0x0a) line += 1;
  return line;
}

/**
 * Inspect every `<picture>...</picture>` block inside a raw HTML chunk and
 * push an issue for any structural violation.
 */
function checkHtmlChunk(html: string, baseLine: number, issues: ValidationIssue[]): void {
  // Comments may legitimately contain anything; strip them first so we don't
  // match `<figure>` / `<img>` text that happens to sit in a comment.
  const stripped = html.replace(COMMENT_RE, (m) => " ".repeat(m.length));

  // Balance check: unclosed <picture> usually indicates a typo that would
  // cascade into misleading "figure inside picture" reports, so surface it
  // explicitly first.
  const openCount = (stripped.match(PICTURE_OPEN_RE) ?? []).length;
  const closeCount = (stripped.match(PICTURE_CLOSE_RE) ?? []).length;
  if (openCount !== closeCount) {
    const firstOpen = stripped.search(PICTURE_OPEN_RE);
    const line = firstOpen >= 0 ? offsetToLine(stripped, firstOpen, baseLine) : baseLine;
    issues.push({
      field: `images (line ${line})`,
      message: `Unbalanced <picture> tags (${openCount} opens vs ${closeCount} closes).`,
      severity: "error",
    });
  }

  PICTURE_BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PICTURE_BLOCK_RE.exec(stripped)) !== null) {
    const inner = m[1] ?? "";
    const line = offsetToLine(stripped, m.index, baseLine);
    const field = `images (line ${line})`;

    if (FIGURE_IN_PICTURE_RE.test(inner)) {
      issues.push({
        field,
        message:
          "<figure> is not allowed inside <picture>. Wrap <picture> with <figure>, not the other way around: `<figure><picture>…<img></picture><figcaption>…</figcaption></figure>`.",
        severity: "error",
      });
    }

    IMG_IN_PICTURE_RE.lastIndex = 0;
    const imgMatches = inner.match(IMG_IN_PICTURE_RE) ?? [];
    if (imgMatches.length === 0) {
      issues.push({
        field,
        message:
          "<picture> must contain a fallback <img>. Browsers use <img> as the default when no <source> matches.",
        severity: "error",
      });
    } else if (imgMatches.length > 1) {
      issues.push({
        field,
        message: `<picture> must contain exactly one <img> (found ${imgMatches.length}).`,
        severity: "error",
      });
    }

    ALLOWED_IN_PICTURE_RE.lastIndex = 0;
    const seenDisallowed = new Set<string>();
    let em: RegExpExecArray | null;
    while ((em = ALLOWED_IN_PICTURE_RE.exec(inner)) !== null) {
      const tag = (em[1] ?? "").toLowerCase();
      if (!tag || seenDisallowed.has(tag)) continue;
      // Already reported via the dedicated figure check.
      if (tag === "figure") continue;
      seenDisallowed.add(tag);
      issues.push({
        field,
        message: `<picture> should only contain <source> and <img> (found <${tag}>).`,
        severity: "error",
      });
    }
  }
}

/**
 * Walk MDAST for every raw-HTML-bearing node so we can inspect author
 * markup without re-parsing the source.
 */
function walk(node: MdastNode, issues: ValidationIssue[]): void {
  if (
    (node.type === "html" || node.type === "mdxJsxFlowElement") &&
    typeof node.value === "string"
  ) {
    const line = node.position?.start.line ?? 1;
    checkHtmlChunk(node.value, line, issues);
  }
  if (node.children) {
    for (const child of node.children) walk(child, issues);
  }
}

/**
 * Replace a matched substring with an equivalent-length whitespace run so
 * downstream line-number reporting stays accurate after stripping.
 */
function blankOut(text: string, re: RegExp): string {
  return text.replace(re, (match) => match.replace(/[^\n]/g, " "));
}

/**
 * Also sweep the raw markdown source to catch raw `<picture>` blocks that
 * a permissive MDAST parser may split across multiple nodes or strip from
 * the tree (rare, but defensive). Fenced code and inline code are blanked
 * out first so author examples like `` `<picture>` `` are not falsely
 * reported as unbalanced tags.
 */
function checkRawContent(rawContent: string, issues: ValidationIssue[]): void {
  const stripped = blankOut(blankOut(rawContent, FENCED_CODE_RE), INLINE_CODE_RE);
  checkHtmlChunk(stripped, 1, issues);
}

/**
 * Validate image HTML structure in a single markdown entry. Exported so
 * callers that already parsed HTML themselves can reuse the rules.
 */
export function validateImageHtml(html: string, baseLine = 1): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkHtmlChunk(html, baseLine, issues);
  return issues;
}

export const imageStructureValidator: ContentValidator = {
  name: "image-structure",

  validate(ctx: ResolvedValidatorContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const tree = ctx.mdast as MdastNode;
    walk(tree, issues);

    // Belt-and-suspenders: scan the raw markdown too, but de-duplicate so
    // the same violation is not reported twice.
    if (ctx.rawContent) {
      const rawIssues: ValidationIssue[] = [];
      checkRawContent(ctx.rawContent, rawIssues);
      const seen = new Set(issues.map((i) => `${i.field}::${i.message}`));
      for (const issue of rawIssues) {
        const key = `${issue.field}::${issue.message}`;
        if (seen.has(key)) continue;
        seen.add(key);
        issues.push(issue);
      }
    }

    return issues;
  },
};
