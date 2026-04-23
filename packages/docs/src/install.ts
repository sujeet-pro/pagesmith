import { processMarkdown, type MarkdownConfig } from "@pagesmith/core/markdown";
import type { DocsInstall } from "./schemas/docs-content.js";

const DEFAULT_INSTALL_LANG = "bash";

/** Spec resolved from either the string shorthand or the rich object form. */
type ResolvedInstallSpec = {
  code: string;
  lang: string;
  title?: string;
  frame?: "code" | "terminal" | "plain";
  showLineNumbers?: boolean;
};

function normalizeInstall(install: DocsInstall): ResolvedInstallSpec | null {
  if (typeof install === "string") {
    const code = install.replace(/\r\n/g, "\n").replace(/\s+$/, "");
    if (code.length === 0) return null;
    return { code, lang: DEFAULT_INSTALL_LANG };
  }

  const code = install.code.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  if (code.length === 0) return null;
  return {
    code,
    lang: install.lang?.trim() || DEFAULT_INSTALL_LANG,
    title: install.title?.trim() || undefined,
    frame: install.frame,
    showLineNumbers: install.showLineNumbers,
  };
}

function escapeMetaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function buildFenceMeta(spec: ResolvedInstallSpec): string {
  const tokens: string[] = [];
  if (spec.title) tokens.push(`title="${escapeMetaValue(spec.title)}"`);
  if (spec.frame) tokens.push(`frame=${spec.frame}`);
  if (spec.showLineNumbers !== undefined) {
    tokens.push(`showLineNumbers=${spec.showLineNumbers ? "true" : "false"}`);
  }
  return tokens.join(" ");
}

/**
 * Pick the longest run of backticks needed to safely fence the install snippet.
 *
 * Install snippets that themselves contain triple-backticks (e.g. a markdown
 * cheat-sheet) would prematurely close a `\`\`\`` fence — count the longest
 * existing backtick run and use one more.
 */
function chooseFence(code: string): string {
  let longestRun = 0;
  let currentRun = 0;
  for (let index = 0; index < code.length; index++) {
    if (code[index] === "`") {
      currentRun++;
      if (currentRun > longestRun) longestRun = currentRun;
    } else {
      currentRun = 0;
    }
  }
  return "`".repeat(Math.max(longestRun + 1, 3));
}

/**
 * Render the home-page install snippet through the standard Pagesmith
 * markdown code pipeline so it shares Shiki highlighting, frame chrome, line
 * numbers, copy button, and tab-grouping with `\`\`\`` blocks elsewhere.
 *
 * Returns `null` when the spec is empty so callers can skip rendering the
 * surrounding section entirely.
 */
export async function renderInstallHtml(
  install: DocsInstall,
  markdownConfig: MarkdownConfig,
): Promise<string | null> {
  const spec = normalizeInstall(install);
  if (!spec) return null;

  const fence = chooseFence(spec.code);
  const meta = buildFenceMeta(spec);
  const fenceLine = meta.length > 0 ? `${fence}${spec.lang} ${meta}` : `${fence}${spec.lang}`;
  const synthetic = `${fenceLine}\n${spec.code}\n${fence}\n`;

  const result = await processMarkdown(synthetic, markdownConfig, {
    content: synthetic,
    frontmatter: {},
  });
  return result.html;
}
