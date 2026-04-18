/**
 * Heading validator — checks heading structure in markdown.
 *
 * Walks the shared MDAST for heading nodes. Validates level ordering and h1 uniqueness.
 */

import type { ValidationIssue } from "./schema-validator";
import type { ContentValidator, MdastNode, ResolvedValidatorContext } from "./types";

/** Extract plain text from a heading node's children. */
function getTextContent(node: MdastNode): string {
  // Text-bearing leaf nodes whose `value` carries user-visible characters.
  // `inlineCode` in particular is common in heading text like `\`npm run\``
  // and should not be treated as empty content.
  if (node.type === "text" || node.type === "inlineCode") return node.value ?? "";
  if (node.children) return node.children.map(getTextContent).join("");
  return "";
}

/** Collect all heading nodes from MDAST. */
function collectHeadings(node: MdastNode): Array<{ depth: number; text: string; line?: number }> {
  const headings: Array<{ depth: number; text: string; line?: number }> = [];

  if (node.type === "heading" && node.depth) {
    headings.push({
      depth: node.depth,
      text: getTextContent(node),
      line: node.position?.start.line,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      headings.push(...collectHeadings(child));
    }
  }

  return headings;
}

export const headingValidator: ContentValidator = {
  name: "headings",

  validate(ctx: ResolvedValidatorContext): ValidationIssue[] {
    if (!ctx.rawContent) return [];

    const issues: ValidationIssue[] = [];
    const tree = ctx.mdast as MdastNode;

    const headings = collectHeadings(tree);

    // No headings in a document with content is worth noting
    if (headings.length === 0) {
      const hasContent = ctx.rawContent.trim().length > 0;
      if (hasContent) {
        issues.push({
          message: "Document has content but no headings",
          severity: "warn",
        });
      }
      return issues;
    }

    // Empty heading text
    for (const h of headings) {
      if (!h.text.trim()) {
        const lineInfo = h.line ? ` (line ${h.line})` : "";
        issues.push({
          field: `headings${lineInfo}`,
          message: `Empty heading at level h${h.depth}`,
          severity: "warn",
        });
      }
    }

    // At most one h1
    const h1s = headings.filter((h) => h.depth === 1);
    if (h1s.length > 1) {
      for (const h of h1s.slice(1)) {
        const lineInfo = h.line ? ` (line ${h.line})` : "";
        issues.push({
          field: `headings${lineInfo}`,
          message: `Multiple h1 headings found: "${h.text}"`,
          severity: "warn",
        });
      }
    }

    // No skipped levels (only flag when going deeper)
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1]!;
      const curr = headings[i]!;
      if (curr.depth > prev.depth + 1) {
        const lineInfo = curr.line ? ` (line ${curr.line})` : "";
        issues.push({
          field: `headings${lineInfo}`,
          message: `Heading level skip: h${prev.depth} -> h${curr.depth} ("${curr.text}")`,
          severity: "warn",
        });
      }
    }

    return issues;
  },
};
