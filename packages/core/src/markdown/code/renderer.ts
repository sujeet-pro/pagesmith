import {
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type LanguageInput,
  type SpecialLanguage,
} from "shiki";
import type { MarkdownConfig } from "../../schemas/markdown-config";
import { type HastNode, PAGESMITH_CODE_LANG_ATTR, setPagesmithCodeBlockMetadata } from "./contract";
import { createLanguageBadge } from "./language-badges";
import { type LineRange, lineInRanges, parseCodeFenceMeta } from "./meta";

const DEFAULT_LIGHT_THEME = "github-light";
const DEFAULT_DARK_THEME = "github-dark";
const PAGESMITH_RENDERER = "pagesmith";
type RenderableLanguage = BundledLanguage | SpecialLanguage;

const COMMON_LANGUAGE_LABELS: Record<string, string> = {
  bash: "Shell",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  go: "Go",
  html: "HTML",
  java: "Java",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  md: "Markdown",
  mdx: "MDX",
  php: "PHP",
  python: "Python",
  ruby: "Ruby",
  rust: "Rust",
  solid: "Solid",
  sql: "SQL",
  svelte: "Svelte",
  ts: "TypeScript",
  tsx: "TSX",
  vue: "Vue",
  yaml: "YAML",
};

/**
 * Pagesmith ships its own Shiki-backed code renderer implementation,
 * but downstream features only target the Pagesmith code block contract.
 *
 * Keep this renderer inside `@pagesmith/core` until all of the following are true:
 * 1. The Pagesmith code block DOM and metadata contract are stable.
 * 2. Tabs, runtime behavior, and CSS no longer depend on core-internal helpers.
 * 3. There is clear reuse demand outside Pagesmith.
 * 4. Independent release cadence outweighs monorepo dogfooding benefits.
 */
export function applyPagesmithCodeRenderer(
  processor: { use: (...args: any[]) => unknown },
  config: MarkdownConfig,
): void {
  processor.use(rehypePagesmithCodeRenderer, config);
}

function rehypePagesmithCodeRenderer(config: MarkdownConfig) {
  const lightTheme = config.shiki?.themes?.light || DEFAULT_LIGHT_THEME;
  const darkTheme = config.shiki?.themes?.dark || DEFAULT_DARK_THEME;
  const defaultShowLineNumbers = config.shiki?.defaultShowLineNumbers ?? true;
  const highlighterPromise = createHighlighter({
    themes: [lightTheme, darkTheme],
    langs: [],
  });

  return async (tree: HastNode) => {
    const highlighter = await highlighterPromise;
    const themeColors = getThemeColors(highlighter, lightTheme, darkTheme);

    await visit(tree);

    async function visit(node: HastNode): Promise<void> {
      if (!Array.isArray(node.children)) return;

      for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index];
        if (isFencePreNode(child)) {
          node.children[index] = await renderCodeBlock(child, {
            highlighter,
            lightTheme,
            darkTheme,
            themeColors,
            defaultShowLineNumbers,
          });
          continue;
        }

        await visit(child);
      }
    }
  };
}

function getTextContent(node: HastNode): string {
  if (node.type === "text") return node.value || "";
  if (node.children) return node.children.map(getTextContent).join("");
  return "";
}

function h(
  tagName: string,
  properties: Record<string, unknown> = {},
  children: HastNode[] = [],
): HastNode {
  return {
    type: "element",
    tagName,
    properties,
    children,
  };
}

function text(value: string): HastNode {
  return { type: "text", value };
}

function isFencePreNode(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "pre" || !Array.isArray(node.children))
    return false;
  if (node.children.length !== 1) return false;
  const [codeNode] = node.children;
  return codeNode?.type === "element" && codeNode.tagName === "code";
}

function getCodeElement(preNode: HastNode): HastNode {
  return preNode.children?.[0] as HastNode;
}

function getClassNames(node: HastNode): string[] {
  const className = node.properties?.className ?? node.properties?.class;
  if (Array.isArray(className))
    return className.filter((value): value is string => typeof value === "string");
  if (typeof className === "string") return className.split(/\s+/).filter(Boolean);
  return [];
}

function getFenceLanguage(codeNode: HastNode): string | undefined {
  for (const className of getClassNames(codeNode)) {
    if (className.startsWith("language-")) {
      const lang = className.slice("language-".length).trim();
      if (lang) return lang;
    }
  }
  return undefined;
}

function getFenceMeta(codeNode: HastNode): string | undefined {
  const data = (codeNode as HastNode & { data?: Record<string, unknown> }).data;
  const meta = data?.meta;
  return typeof meta === "string" && meta.trim().length > 0 ? meta : undefined;
}

function formatStyle(properties: Record<string, string | undefined>): string | undefined {
  const declarations = Object.entries(properties)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value]) => `${key}:${value}`);
  return declarations.length > 0 ? declarations.join(";") : undefined;
}

async function ensureRenderableLanguage(
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  lang: string | undefined,
): Promise<RenderableLanguage> {
  if (!lang || lang === "text") return "text";

  if (!highlighter.getLoadedLanguages().includes(lang)) {
    try {
      await highlighter.loadLanguage(lang as unknown as LanguageInput);
    } catch {
      return "text";
    }
  }
  return lang as RenderableLanguage;
}

function getThemeColors(
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  lightTheme: string,
  darkTheme: string,
): { lightBg: string; darkBg: string; lightFg: string; darkFg: string } {
  const light = highlighter.getTheme(lightTheme);
  const dark = highlighter.getTheme(darkTheme);
  return {
    lightBg: light.bg || "#ffffff",
    darkBg: dark.bg || "#111827",
    lightFg: light.fg || "#111827",
    darkFg: dark.fg || "#f9fafb",
  };
}

function getLanguageLabel(
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  requestedLang: string | undefined,
  renderedLang: string,
): string {
  const lang = requestedLang || renderedLang;
  if (lang === "text") return "Text";

  const commonLabel = COMMON_LANGUAGE_LABELS[lang.toLowerCase()];
  if (commonLabel) return commonLabel;

  let languageInfo:
    | {
        displayName?: string;
      }
    | undefined;
  try {
    languageInfo = highlighter.getLanguage(renderedLang) as { displayName?: string } | undefined;
  } catch {
    languageInfo = undefined;
  }
  const displayName =
    languageInfo &&
    typeof languageInfo.displayName === "string" &&
    languageInfo.displayName.trim().length > 0
      ? languageInfo.displayName
      : undefined;

  if (displayName) return displayName;
  return lang
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createToolbarChip(
  label: string,
  lang: string | undefined,
  languageLabel: string,
): HastNode {
  return h("span", { className: ["ps-code-toolbar-chip"] }, [
    createLanguageBadge(lang, languageLabel),
    h("span", { className: ["ps-code-toolbar-label"] }, [text(label)]),
  ]);
}

function createToolbarMain(
  label: string,
  lang: string | undefined,
  frame: "code" | "terminal" | "plain",
  languageLabel: string,
): HastNode | null {
  if (frame === "plain") return null;

  if (frame === "terminal") {
    return h("div", { className: ["ps-code-toolbar-main", "ps-code-toolbar-main--terminal"] }, [
      h("span", { className: ["ps-code-traffic-lights"], "aria-hidden": "true" }, [
        h("span", { className: ["ps-code-traffic-light"] }),
        h("span", { className: ["ps-code-traffic-light"] }),
        h("span", { className: ["ps-code-traffic-light"] }),
      ]),
      createToolbarChip(label, lang, languageLabel),
    ]);
  }

  return h("div", { className: ["ps-code-toolbar-main", "ps-code-toolbar-main--code"] }, [
    createToolbarChip(label, lang, languageLabel),
  ]);
}

function createCopyIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-copy-icon"],
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("rect", { x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5" }),
      h("path", {
        d: "M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5",
      }),
    ],
  );
}

function createCopiedIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-copy-icon", "ps-code-copy-icon--copied"],
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [h("path", { d: "M3.5 9 6.5 12 12.5 4.5" })],
  );
}

function createCopyButton(): HastNode {
  return h(
    "button",
    {
      className: ["ps-code-copy"],
      type: "button",
      "data-ps-code-copy": "true",
      "data-copy-label": "Copy",
      "data-copied-label": "Copied",
      "data-error-label": "Retry",
      "aria-label": "Copy code block",
      title: "Copy",
    },
    [createCopyIcon(), createCopiedIcon()],
  );
}

function trimTrailingEmptyTokenLine<T>(lines: T[], code: string): T[] {
  if (!code.endsWith("\n")) return lines;
  return lines.length > 1 ? lines.slice(0, -1) : lines;
}

function getTokenStyle(
  lightVariant: { color?: string; fontStyle?: number } | undefined,
  darkVariant: { color?: string; fontStyle?: number } | undefined,
): string | undefined {
  const fontStyle = lightVariant?.fontStyle ?? darkVariant?.fontStyle ?? 0;
  const decorations: string[] = [];
  if (fontStyle & 4) decorations.push("underline");
  if (fontStyle & 8) decorations.push("line-through");

  return formatStyle({
    color: lightVariant?.color,
    "--shiki-dark": darkVariant?.color,
    "font-style": fontStyle & 1 ? "italic" : undefined,
    "font-weight": fontStyle & 2 ? "700" : undefined,
    "text-decoration": decorations.length > 0 ? decorations.join(" ") : undefined,
  });
}

function createLineNode(
  physicalLineNumber: number,
  displayLineNumber: number,
  lineTokens: Array<{
    content: string;
    variants: {
      light: { color?: string; fontStyle?: number };
      dark: { color?: string; fontStyle?: number };
    };
  }>,
  meta: ReturnType<typeof parseCodeFenceMeta>,
): HastNode {
  const className = ["ps-code-line"];
  if (lineInRanges(physicalLineNumber, meta.mark)) className.push("ps-code-line--mark");
  if (lineInRanges(physicalLineNumber, meta.ins)) className.push("ps-code-line--ins");
  if (lineInRanges(physicalLineNumber, meta.del)) className.push("ps-code-line--del");

  const children: HastNode[] = [];

  if (meta.showLineNumbers) {
    children.push(
      h("span", { className: ["ps-code-line-number"], "aria-hidden": "true" }, [
        text(String(displayLineNumber)),
      ]),
    );
  }

  const tokenNodes =
    lineTokens.length > 0
      ? lineTokens.map((token) =>
          h(
            "span",
            {
              style: getTokenStyle(token.variants.light, token.variants.dark),
            },
            [text(token.content)],
          ),
        )
      : [];

  children.push(
    h(
      "span",
      {
        className: ["ps-code-line-content"],
      },
      tokenNodes,
    ),
  );

  return h(
    "span",
    {
      className,
      "data-ps-code-line": String(physicalLineNumber),
    },
    children,
  );
}

function createCollapsedGroup(lines: HastNode[], range: LineRange): HastNode {
  const lineCount = range.end - range.start + 1;
  const expandLabel = `Show ${lineCount} hidden ${lineCount === 1 ? "line" : "lines"}`;
  const collapseLabel = `Hide ${lineCount} hidden ${lineCount === 1 ? "line" : "lines"}`;

  return h("span", { className: ["ps-code-collapse"], "data-ps-code-collapse": "true" }, [
    h(
      "button",
      {
        className: ["ps-code-collapse-toggle"],
        type: "button",
        "data-ps-code-collapse-toggle": "true",
        "data-expand-label": expandLabel,
        "data-collapse-label": collapseLabel,
        "aria-expanded": "false",
      },
      [text(expandLabel)],
    ),
    h(
      "span",
      {
        className: ["ps-code-collapse-lines"],
        "data-ps-code-collapse-lines": "true",
        hidden: true,
      },
      lines,
    ),
  ]);
}

function applyCollapsedLineRanges(lines: HastNode[], collapseRanges: LineRange[]): HastNode[] {
  if (collapseRanges.length === 0) return lines;

  const result: HastNode[] = [];
  let lineIndex = 1;

  for (const range of collapseRanges) {
    while (lineIndex < range.start && lineIndex <= lines.length) {
      result.push(lines[lineIndex - 1]!);
      lineIndex++;
    }

    if (range.start > lines.length) break;

    const start = Math.max(range.start, 1);
    const end = Math.min(range.end, lines.length);
    result.push(createCollapsedGroup(lines.slice(start - 1, end), { start, end }));
    lineIndex = end + 1;
  }

  while (lineIndex <= lines.length) {
    result.push(lines[lineIndex - 1]!);
    lineIndex++;
  }

  return result;
}

async function renderCodeBlock(
  preNode: HastNode,
  options: {
    highlighter: Awaited<ReturnType<typeof createHighlighter>>;
    lightTheme: string;
    darkTheme: string;
    themeColors: { lightBg: string; darkBg: string; lightFg: string; darkFg: string };
    defaultShowLineNumbers: boolean;
  },
): Promise<HastNode> {
  const codeNode = getCodeElement(preNode);
  const requestedLang = getFenceLanguage(codeNode);
  const rawCode = getTextContent(codeNode).replace(/\r\n/g, "\n");
  const meta = parseCodeFenceMeta(getFenceMeta(codeNode), {
    defaultShowLineNumbers: options.defaultShowLineNumbers,
    lang: requestedLang,
  });
  const renderedLang = await ensureRenderableLanguage(options.highlighter, requestedLang);
  const languageLabel = getLanguageLabel(options.highlighter, requestedLang, renderedLang);

  const tokenLines = trimTrailingEmptyTokenLine(
    options.highlighter.codeToTokensWithThemes(rawCode, {
      lang: renderedLang,
      themes: {
        light: options.lightTheme as BundledTheme,
        dark: options.darkTheme as BundledTheme,
      },
    }),
    rawCode,
  );

  const renderedLines = tokenLines.map((lineTokens, index) =>
    createLineNode(index + 1, meta.startLineNumber + index, lineTokens as any, meta),
  );
  const codeChildren = applyCollapsedLineRanges(renderedLines, meta.collapse);

  const toolbarChildren: HastNode[] = [];
  const toolbarMain = createToolbarMain(
    meta.title || languageLabel,
    requestedLang || renderedLang,
    meta.frame,
    languageLabel,
  );
  if (toolbarMain) toolbarChildren.push(toolbarMain);
  toolbarChildren.push(createCopyButton());

  const root = h(
    "figure",
    {
      className: ["ps-code-block"],
      style: formatStyle({
        "--ps-code-light-bg": options.themeColors.lightBg,
        "--ps-code-dark-bg": options.themeColors.darkBg,
        "--ps-code-light-fg": options.themeColors.lightFg,
        "--ps-code-dark-fg": options.themeColors.darkFg,
      }),
      [PAGESMITH_CODE_LANG_ATTR]: requestedLang || renderedLang,
      "data-ps-code-wrap": meta.wrap ? "true" : "false",
      "data-ps-code-line-numbers": meta.showLineNumbers ? "true" : "false",
    },
    [
      h(
        "div",
        {
          className: [
            "ps-code-toolbar",
            meta.frame === "plain" ? "ps-code-toolbar--plain" : `ps-code-toolbar--${meta.frame}`,
          ],
        },
        toolbarChildren,
      ),
      h("div", { className: ["ps-code-body"] }, [
        h(
          "pre",
          {
            className: ["ps-code-pre", "shiki", "shiki-themes"],
            tabindex: "0",
            style: formatStyle({
              "background-color": options.themeColors.lightBg,
              "--shiki-dark-bg": options.themeColors.darkBg,
              color: options.themeColors.lightFg,
              "--shiki-dark": options.themeColors.darkFg,
            }),
          },
          [
            h(
              "code",
              {
                className: ["ps-code-code", `language-${requestedLang || renderedLang}`],
              },
              codeChildren,
            ),
          ],
        ),
      ]),
    ],
  );

  setPagesmithCodeBlockMetadata(root, {
    renderer: PAGESMITH_RENDERER,
    title: meta.title,
    frame: meta.frame,
  });

  return root;
}
