import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeMathjax from "rehype-mathjax/svg";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import { unified } from "unified";
import type { Heading } from "../schemas/heading";
import type { MarkdownConfig } from "../schemas/markdown-config";
import { applyPagesmithCodeRenderer } from "./code/renderer";
import rehypeA11y from "./plugins/rehype-a11y";
import rehypeCodeTabs from "./plugins/rehype-code-tabs";
import { rehypeLocalImages } from "./plugins/rehype-local-images";
import rehypeScrollableTables from "./plugins/rehype-scrollable-tables";

export type MarkdownResult = {
  html: string;
  headings: Heading[];
  frontmatter: Record<string, unknown>;
};

type PreExtractedMarkdown = {
  content: string;
  frontmatter: Record<string, unknown>;
  fileData?: Record<string, unknown>;
};

export type { MarkdownConfig };

const DEFAULT_MARKDOWN_CONFIG: MarkdownConfig = {};

/** Default language aliases for fenced code blocks that Shiki doesn't recognize natively. */
const DEFAULT_LANG_ALIASES: Record<string, string> = {
  dot: "text",
  mermaid: "text",
  plantuml: "text",
  excalidraw: "json",
  drawio: "xml",
  proto: "protobuf",
  ejs: "html",
  hbs: "handlebars",
};

function getTextContent(node: any): string {
  if (node.type === "text") return node.value || "";
  if (node.children) return node.children.map(getTextContent).join("");
  return "";
}

function extractHeadings(tree: any, headings: Heading[]): void {
  if (tree.type === "element" && /^h[1-6]$/.test(tree.tagName)) {
    headings.push({
      depth: parseInt(tree.tagName[1]),
      text: getTextContent(tree),
      slug: tree.properties?.id || "",
    });
  }
  if (tree.children) {
    for (const child of tree.children) {
      extractHeadings(child, headings);
    }
  }
}

function contentMayContainMath(content: string): boolean {
  return (
    content.includes("$$") ||
    content.includes("\\(") ||
    content.includes("\\[") ||
    /(^|[^\\])\$(?![\s$])/.test(content)
  );
}

function shouldEnableMath(content: string, config: MarkdownConfig): boolean {
  const mathMode = config.math ?? "auto";
  return mathMode === true || (mathMode === "auto" && contentMayContainMath(content));
}

function createProcessor(config: MarkdownConfig, options: { enableMath: boolean }) {
  const allowDangerousHtml = config.allowDangerousHtml ?? true;
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ["yaml"])
    // GitHub-flavored alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    .use(remarkGithubAlerts)
    // Smart typography: "smart quotes", em—dashes, el…lipses
    .use(remarkSmartypants);

  if (options.enableMath) {
    processor.use(remarkMath);
  }

  if (config.remarkPlugins) {
    for (const plugin of config.remarkPlugins) {
      if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1]);
      else processor.use(plugin);
    }
  }

  // Apply language aliases to fenced code blocks before the built-in code renderer processes them.
  // Merge defaults with user-provided aliases (user overrides take precedence).
  const langAlias = { ...DEFAULT_LANG_ALIASES, ...config.shiki?.langAlias };
  processor.use(() => (tree: any) => {
    const visit = (node: any): void => {
      if (node?.type === "code" && typeof node.lang === "string" && langAlias[node.lang]) {
        node.lang = langAlias[node.lang];
      }
      if (Array.isArray(node?.children)) {
        for (const child of node.children) visit(child);
      }
    };
    visit(tree);
  });

  processor.use(remarkRehype, { allowDangerousHtml });

  // MathJax must run before the built-in code renderer so math is rendered to SVG
  // before code highlighting touches the HAST tree.
  if (options.enableMath) {
    processor.use(rehypeMathjax);
  }

  // Built-in code renderer stage. Downstream plugins target the
  // Pagesmith-owned code block contract instead of renderer internals.
  applyPagesmithCodeRenderer(processor, config);

  // Group consecutive titled code blocks into a tabbed interface.
  // Must run after the built-in code renderer so it can inspect the Pagesmith contract.
  processor.use(rehypeCodeTabs);
  processor.use(rehypeScrollableTables);

  processor
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    // External links: add target="_blank" rel="noopener noreferrer" to absolute URLs
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    })
    // Accessible emojis: wrap emoji characters in <span role="img" aria-label="...">
    .use(rehypeAccessibleEmojis)
    // Patch WCAG 2.2 AA gaps left by upstream plugins:
    //   - GFM task-list checkboxes are nameless without this.
    //   - MathJax SVGs (`role="img"`) need an accessible name.
    .use(rehypeA11y)
    // Fill intrinsic image dimensions from the local filesystem and wrap JPEGs
    // in <picture> so browsers can prefer AVIF/WebP while keeping JPEG fallback.
    .use(rehypeLocalImages);

  processor.use(() => (tree: any, file: any) => {
    const headings: Heading[] = [];
    extractHeadings(tree, headings);
    file.data.headings = headings;
  });

  if (config.rehypePlugins) {
    for (const plugin of config.rehypePlugins) {
      if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1]);
      else processor.use(plugin);
    }
  }

  processor.use(rehypeStringify, { allowDangerousHtml });
  return processor;
}

/**
 * Processor cache keyed by MarkdownConfig object reference.
 *
 * **Why a WeakMap keyed by object reference?**
 * Building a unified processor chain is expensive — it loads Shiki grammars,
 * theme JSON, and instantiates every remark/rehype plugin. Caching the
 * processor by config reference lets callers that reuse the same config object
 * (the common case) skip all of that setup on subsequent calls. The WeakMap
 * also ensures that if a config object is garbage-collected, its processor is
 * too, so long-running processes don't leak memory.
 *
 * Pagesmith keeps separate processor instances per config reference for the
 * math-enabled and math-disabled variants because the auto math mode can
 * choose a cheaper pipeline for content that does not contain math markers.
 *
 * **Why is the config frozen?**
 * The cache assumes the config does not change after the processor is built.
 * If a caller mutated a config object after the processor was created, later
 * calls would still receive the stale processor (keyed by the same reference),
 * producing silently wrong output. Freezing the config at first use turns that
 * silent bug into a loud TypeError on any attempted mutation.
 *
 * **What if a consumer needs different settings?**
 * Pass a new config object — a fresh reference gets its own cache entry.
 * For example: `processMarkdown(md, { ...existingConfig, remarkPlugins: [...] })`.
 */
function deepFreeze<T extends object>(obj: T): T {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

type CachedProcessors = {
  withMath?: ReturnType<typeof createProcessor>;
  withoutMath?: ReturnType<typeof createProcessor>;
};

const processorCache = new WeakMap<MarkdownConfig, CachedProcessors>();

export async function processMarkdown(
  raw: string,
  config?: MarkdownConfig,
  preExtracted?: PreExtractedMarkdown,
): Promise<MarkdownResult> {
  let frontmatter: Record<string, unknown>;
  let content: string;
  const fileData = preExtracted?.fileData ?? {};
  if (preExtracted) {
    frontmatter = preExtracted.frontmatter;
    content = preExtracted.content;
  } else {
    const parsed = matter(raw, { engines: { yaml: parseYaml } });
    frontmatter = parsed.data;
    content = parsed.content;
  }
  const resolvedConfig =
    config && Object.keys(config).length > 0 ? config : DEFAULT_MARKDOWN_CONFIG;
  // Freeze to prevent mutation after caching — see processorCache JSDoc above.
  if (Object.isFrozen(resolvedConfig) === false) deepFreeze(resolvedConfig);
  const enableMath = shouldEnableMath(content, resolvedConfig);
  let cachedProcessors = processorCache.get(resolvedConfig);
  if (!cachedProcessors) {
    cachedProcessors = {};
    processorCache.set(resolvedConfig, cachedProcessors);
  }
  let processor = enableMath ? cachedProcessors.withMath : cachedProcessors.withoutMath;
  if (!processor) {
    processor = createProcessor(resolvedConfig, { enableMath });
    if (enableMath) cachedProcessors.withMath = processor;
    else cachedProcessors.withoutMath = processor;
  }
  try {
    const result = await processor.process({
      value: content,
      data: fileData,
    });
    const headings = Array.isArray(result.data.headings) ? (result.data.headings as Heading[]) : [];
    return { html: String(result), headings, frontmatter };
  } catch (err) {
    throw new Error(
      `Markdown processing failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
}
