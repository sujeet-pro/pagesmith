/**
 * Code block validator — checks fenced code block meta syntax.
 *
 * Walks the shared MDAST for `code` nodes. Validates known meta properties
 * and language identifiers. Meta syntax follows Pagesmith's built-in code
 * renderer conventions.
 */

import type { ValidationIssue } from "./schema-validator";
import type { ContentValidator, MdastNode, ResolvedValidatorContext } from "./types";

/** Known meta properties accepted by the built-in Pagesmith code renderer. */
const KNOWN_META_PROPS = new Set([
  "title",
  "showLineNumbers",
  "startLineNumber",
  "wrap",
  "frame",
  "collapse",
  "mark",
  "ins",
  "del",
]);

/** Meta properties that accept line range values like {1-5,8,10-12}. */
const LINE_RANGE_PROPS = new Set(["mark", "ins", "del", "collapse"]);

/** Extract meta tokens as key-value pairs from a meta string. */
function extractMetaTokens(meta: string): Array<{ key: string; value?: string }> {
  const tokens: Array<{ key: string; value?: string }> = [];

  const tokenRegex = /(\w+)(?:=(\{[^}]*\}|"[^"]*"|'[^']*'|\S+))?/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(meta)) !== null) {
    const raw = match[2];
    let value: string | undefined;
    if (raw !== undefined) {
      // Strip surrounding braces, quotes
      if (
        (raw.startsWith("{") && raw.endsWith("}")) ||
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
      ) {
        value = raw.slice(1, -1);
      } else {
        value = raw;
      }
    }
    tokens.push({ key: match[1]!, value });
  }

  return tokens;
}

/** Validate that a line range value contains only valid tokens. */
function findMalformedRangeTokens(value: string): string[] {
  const bad: string[] = [];
  for (const part of value.split(",")) {
    const token = part.trim();
    if (!token) continue;
    if (/^\d+$/.test(token)) continue;
    if (/^\d+\s*-\s*\d+$/.test(token)) continue;
    bad.push(token);
  }
  return bad;
}

/** Collect all `code` nodes from MDAST. */
function collectCodeBlocks(node: MdastNode): MdastNode[] {
  const blocks: MdastNode[] = [];

  if (node.type === "code") {
    blocks.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      blocks.push(...collectCodeBlocks(child));
    }
  }

  return blocks;
}

export const codeBlockValidator: ContentValidator = {
  name: "code-blocks",

  validate(ctx: ResolvedValidatorContext): ValidationIssue[] {
    if (!ctx.rawContent) return [];

    const issues: ValidationIssue[] = [];
    const tree = ctx.mdast as MdastNode;

    const codeBlocks = collectCodeBlocks(tree);

    for (const block of codeBlocks) {
      const line = block.position?.start.line;
      const lineInfo = line ? ` (line ${line})` : "";
      const meta = block.meta ?? "";
      const hasMeta = meta.trim().length > 0;

      // Language required when using syntax features
      if (hasMeta && !block.lang) {
        issues.push({
          field: `code-block${lineInfo}`,
          message: "Code block has meta properties but no language identifier",
          severity: "warn",
        });
      }

      if (!hasMeta) continue;

      // Check for unknown meta properties and malformed line ranges
      const tokens = extractMetaTokens(meta);
      for (const { key, value } of tokens) {
        if (!KNOWN_META_PROPS.has(key)) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Unknown code block meta property: "${key}"`,
            severity: "warn",
          });
        }

        if (LINE_RANGE_PROPS.has(key) && typeof value === "string" && value.length > 0) {
          const bad = findMalformedRangeTokens(value);
          for (const token of bad) {
            issues.push({
              field: `code-block${lineInfo}`,
              message: `Malformed line range "${token}" in ${key}={...} — expected a number or range like 1-5`,
              severity: "warn",
            });
          }
        }
      }
    }

    return issues;
  },
};
