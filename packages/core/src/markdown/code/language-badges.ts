import type { HastNode } from "./contract";

type BadgeIconKind = "monogram" | "terminal" | "markup" | "data" | "document";

type BadgePreset = {
  shortLabel: string;
  background: string;
  foreground: string;
  icon: BadgeIconKind;
};

const LANGUAGE_ALIASES: Record<string, string> = {
  csharp: "csharp",
  "c#": "csharp",
  cs: "csharp",
  cpp: "cpp",
  "c++": "cpp",
  golang: "go",
  htm: "html",
  javascript: "js",
  json5: "json",
  jsonc: "json",
  jsx: "jsx",
  markdown: "md",
  mdown: "md",
  mdx: "mdx",
  py: "python",
  rs: "rust",
  sass: "css",
  scss: "css",
  shell: "bash",
  shellscript: "bash",
  sh: "bash",
  tsx: "tsx",
  typescript: "ts",
  vuehtml: "vue",
  yml: "yaml",
  zsh: "bash",
};

const LANGUAGE_PRESETS: Record<string, BadgePreset> = {
  bash: { shortLabel: ">_", background: "#111827", foreground: "#86efac", icon: "terminal" },
  c: { shortLabel: "C", background: "#64748b", foreground: "#ffffff", icon: "monogram" },
  cpp: { shortLabel: "C++", background: "#2563eb", foreground: "#ffffff", icon: "monogram" },
  csharp: { shortLabel: "C#", background: "#68217a", foreground: "#ffffff", icon: "monogram" },
  css: { shortLabel: "CSS", background: "#1572b6", foreground: "#ffffff", icon: "markup" },
  go: { shortLabel: "GO", background: "#00add8", foreground: "#0f172a", icon: "monogram" },
  html: { shortLabel: "HTML", background: "#e34f26", foreground: "#ffffff", icon: "markup" },
  java: { shortLabel: "JV", background: "#f89820", foreground: "#111827", icon: "monogram" },
  js: { shortLabel: "JS", background: "#f7df1e", foreground: "#111827", icon: "monogram" },
  json: { shortLabel: "{}", background: "#f59e0b", foreground: "#111827", icon: "data" },
  jsx: { shortLabel: "JSX", background: "#61dafb", foreground: "#0f172a", icon: "markup" },
  md: { shortLabel: "MD", background: "#0f172a", foreground: "#ffffff", icon: "document" },
  mdx: { shortLabel: "MDX", background: "#6366f1", foreground: "#ffffff", icon: "document" },
  php: { shortLabel: "PHP", background: "#777bb4", foreground: "#ffffff", icon: "monogram" },
  python: { shortLabel: "PY", background: "#3776ab", foreground: "#ffffff", icon: "monogram" },
  ruby: { shortLabel: "RB", background: "#cc342d", foreground: "#ffffff", icon: "monogram" },
  rust: { shortLabel: "RS", background: "#dea584", foreground: "#111827", icon: "monogram" },
  solid: { shortLabel: "SO", background: "#2c4f7c", foreground: "#ffffff", icon: "monogram" },
  sql: { shortLabel: "SQL", background: "#336791", foreground: "#ffffff", icon: "data" },
  svelte: { shortLabel: "SV", background: "#ff3e00", foreground: "#ffffff", icon: "monogram" },
  ts: { shortLabel: "TS", background: "#3178c6", foreground: "#ffffff", icon: "monogram" },
  tsx: { shortLabel: "TSX", background: "#3178c6", foreground: "#ffffff", icon: "markup" },
  vue: { shortLabel: "VUE", background: "#42b883", foreground: "#0f172a", icon: "monogram" },
  yaml: { shortLabel: "YML", background: "#dc2626", foreground: "#ffffff", icon: "data" },
};

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

function formatStyle(properties: Record<string, string | undefined>): string | undefined {
  const declarations = Object.entries(properties)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value]) => `${key}:${value}`);
  return declarations.length > 0 ? declarations.join(";") : undefined;
}

function normalizeLanguageKey(lang: string | undefined): string {
  if (!lang) return "text";
  const cleaned = lang
    .trim()
    .toLowerCase()
    .replace(/^language-/, "");
  if (!cleaned) return "text";
  return LANGUAGE_ALIASES[cleaned] ?? cleaned;
}

function getFallbackColors(key: string): { background: string; foreground: string } {
  let hash = 0;
  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const hue = hash % 360;
  // Lightness 30% keeps the badge readable across all hues — even the
  // brightest yellow/green hues clear WCAG 2.2 AA 4.5:1 against the white
  // foreground. The previous 42% lightness landed around ~3.2:1 for
  // hues in the 40–80 range (e.g. json5 → hsl(45 62% 42%)).
  return {
    background: `hsl(${hue} 62% 30%)`,
    foreground: "#ffffff",
  };
}

function getFallbackLabel(key: string): string {
  if (key === "text") return "TXT";
  const cleaned = key.replace(/[^a-z0-9]+/gi, " ").trim();
  if (!cleaned) return "TXT";
  const parts = cleaned.split(/\s+/);
  if (parts.length > 1) {
    return parts
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 4)
      .toUpperCase();
  }
  return cleaned.slice(0, 4).toUpperCase();
}

function createMonogramIcon(shortLabel: string): HastNode {
  const iconLabel = shortLabel.length > 3 ? shortLabel.slice(0, 3) : shortLabel;
  return h(
    "svg",
    {
      className: ["ps-code-language-icon", "ps-code-language-icon--monogram"],
      viewBox: "0 0 20 20",
      "aria-hidden": "true",
    },
    [
      h(
        "text",
        {
          x: "10",
          y: "12.5",
          "text-anchor": "middle",
          "font-size": shortLabel.length > 2 ? "6" : "7",
          "font-weight": "700",
          fill: "currentColor",
        },
        [text(iconLabel)],
      ),
    ],
  );
}

function createTerminalIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-language-icon", "ps-code-language-icon--terminal"],
      viewBox: "0 0 20 20",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("rect", { x: "3", y: "4", width: "14", height: "12", rx: "2" }),
      h("path", { d: "M6.5 8.5 8.75 10.5 6.5 12.5" }),
      h("path", { d: "M10.5 12.5h3" }),
    ],
  );
}

function createMarkupIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-language-icon", "ps-code-language-icon--markup"],
      viewBox: "0 0 20 20",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("path", { d: "M8 6.5 4.75 10 8 13.5" }),
      h("path", { d: "M12 6.5 15.25 10 12 13.5" }),
      h("path", { d: "M10.75 5.5 9.25 14.5" }),
    ],
  );
}

function createDataIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-language-icon", "ps-code-language-icon--data"],
      viewBox: "0 0 20 20",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("path", {
        d: "M7.25 5.5c-1 0-1.5.75-1.5 1.75v1.25c0 .8-.45 1.5-1.25 1.5.8 0 1.25.7 1.25 1.5v1.25c0 1 .5 1.75 1.5 1.75",
      }),
      h("path", {
        d: "M12.75 5.5c1 0 1.5.75 1.5 1.75v1.25c0 .8.45 1.5 1.25 1.5-.8 0-1.25.7-1.25 1.5v1.25c0 1-.5 1.75-1.5 1.75",
      }),
      h("path", { d: "M8.5 8h3" }),
      h("path", { d: "M8.5 10h3" }),
      h("path", { d: "M8.5 12h3" }),
    ],
  );
}

function createDocumentIcon(): HastNode {
  return h(
    "svg",
    {
      className: ["ps-code-language-icon", "ps-code-language-icon--document"],
      viewBox: "0 0 20 20",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("path", {
        d: "M7 3.75h4.75L15 7v9.25H7A1.25 1.25 0 0 1 5.75 15V5A1.25 1.25 0 0 1 7 3.75Z",
      }),
      h("path", { d: "M11.75 3.75V7H15" }),
      h("path", { d: "M8 10h4.5" }),
      h("path", { d: "M8 12.5h4.5" }),
    ],
  );
}

function createKnownIcon(kind: BadgeIconKind, shortLabel: string): HastNode {
  switch (kind) {
    case "terminal":
      return createTerminalIcon();
    case "markup":
      return createMarkupIcon();
    case "data":
      return createDataIcon();
    case "document":
      return createDocumentIcon();
    case "monogram":
    default:
      return createMonogramIcon(shortLabel);
  }
}

export function createLanguageBadge(lang: string | undefined, title?: string): HastNode {
  const key = normalizeLanguageKey(lang);
  const preset = LANGUAGE_PRESETS[key];

  if (!preset) {
    const fallbackColors = getFallbackColors(key);
    return h(
      "span",
      {
        className: ["ps-code-language-badge", "ps-code-language-badge--text"],
        "data-ps-code-language": key,
        style: formatStyle({
          "--ps-code-language-badge-bg": fallbackColors.background,
          "--ps-code-language-badge-fg": fallbackColors.foreground,
        }),
        "aria-hidden": "true",
        ...(title ? { title } : {}),
      },
      [text(getFallbackLabel(key))],
    );
  }

  return h(
    "span",
    {
      className: ["ps-code-language-badge", "ps-code-language-badge--icon"],
      "data-ps-code-language": key,
      style: formatStyle({
        "--ps-code-language-badge-bg": preset.background,
        "--ps-code-language-badge-fg": preset.foreground,
      }),
      "aria-hidden": "true",
      ...(title ? { title } : {}),
    },
    [createKnownIcon(preset.icon, preset.shortLabel)],
  );
}
