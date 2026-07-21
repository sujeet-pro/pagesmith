---
name: pagesmith-core-customize-markdown
description: Add custom remark or rehype plugins, change Shiki themes, tweak math behavior, or register language aliases in the Pagesmith markdown pipeline without replacing the built-in defaults. Use when the user wants Mermaid diagrams, reading-time estimates, custom admonitions, GitHub-style anchors with different slugs, or different syntax-highlighting themes.
allowed-tools: Bash(npx pagesmith-core *)
---

# Customize The Pagesmith Markdown Pipeline

The built-in pipeline already handles GFM, GitHub alerts, math (opt-in), smart punctuation, Shiki code highlighting, code tabs, scrollable tables, autolinked headings, external links, accessible emoji, and local image resolution. You extend it — you do not replace it.

## Read the locally installed reference first

Before editing config or plugins, open `node_modules/@pagesmith/core/REFERENCE.md` and `./references/markdown-guidelines.md` in the consumer's project. They are version-matched to the installed package and authoritative for the `MarkdownConfig` shape, the supported `math`/`mathEngine` values, the Shiki options, and the order of built-in remark/rehype steps. If they disagree with this skill or general training data, follow the local files.

Run verification commands (`npx vite build`, `npx vite dev`) through `npx` or `package.json` scripts so they resolve to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## Configure via `defineConfig`

```ts
// markdown.config.ts
import type { MarkdownConfig } from "@pagesmith/core";
import remarkReadingTime from "remark-reading-time";
import rehypeMermaid from "rehype-mermaid";

export const markdown: MarkdownConfig = {
  remarkPlugins: [remarkReadingTime],
  rehypePlugins: [rehypeMermaid],
  math: "auto",
  shiki: {
    themes: {
      light: "github-light",
      dark: "one-dark-pro",
    },
    langAlias: {
      vue: "html",
      njk: "twig",
    },
    defaultShowLineNumbers: true,
  },
};
```

Wire it into the main config:

```ts
// content.config.ts (or wherever defineConfig lives)
import { defineConfig } from "@pagesmith/core";
import collections from "./collections";
import { markdown } from "./markdown.config";

export default defineConfig({ collections, markdown });
```

## Pipeline order (and where your plugins slot in)

```text
parse
  → gfm
  → frontmatter
  → github-alerts
  → smartypants
  → (math, if enabled)
  → [user remark plugins]
  → lang-alias
  → rehype
  → (mathjax, if enabled)
  → pagesmith code renderer
  → code-tabs
  → scrollable-tables
  → slug
  → autolink-headings
  → external-links
  → accessible-emojis
  → local-images
  → heading extraction
  → [user rehype plugins]
  → stringify
```

User plugins run **after** the defaults at their respective tiers. This means your remark plugins can rely on GFM tables, alerts, and math already being parsed; your rehype plugins can rely on slugs and code-block transforms already applied.

## Common customizations

### Add Mermaid diagrams

```ts
import rehypeMermaid from "rehype-mermaid";

export const markdown: MarkdownConfig = {
  rehypePlugins: [rehypeMermaid],
};
```

Mermaid fences (` ```mermaid `) render client-side. If you want server-rendered SVG, use the strategy that fits your build — `rehypeMermaid` supports several.

### Change Shiki themes

```ts
shiki: {
  themes: {
    light: 'github-light',
    dark: 'rose-pine-moon',
  },
}
```

Dual themes are emitted as CSS-variable-driven HTML. The site's theme toggle automatically picks the right one via `[data-theme]`.

### Register language aliases

```ts
shiki: {
  langAlias: {
    vue: 'html',
    astro: 'html',
    erb: 'html.erb',
  },
}
```

Aliases solve "unknown language" warnings without adding full grammars.

### Toggle math

| `math`            | Effect                                                    |
| ----------------- | --------------------------------------------------------- |
| `false` (default) | No math rendering — `$…$` passes through as literal text. |
| `true`            | Always enabled. Adds the KaTeX assets to every page.      |
| `'auto'`          | Enabled per-page only when `$…$` or `$$…$$` is detected.  |

Prefer `'auto'` unless you author math on every page.

### Server-render math with MathJax instead of KaTeX

```ts
math: 'auto',
mathEngine: 'mathjax',
```

Default is KaTeX. Switch only if you need features unique to MathJax.

### Line numbers by default

```ts
shiki: {
  defaultShowLineNumbers: true,
}
```

Override per fence with `{:line-numbers}` or `{:no-line-numbers}` after the language tag:

````md
```ts {:line-numbers}
const x = 1;
```
````

## Rules

- Do not re-import `unified` directly. `@pagesmith/core` owns the processor lifecycle and caches it per `MarkdownConfig` object identity.
- Keep the `MarkdownConfig` object **stable** across renders. If you rebuild it every call, the cache busts and every render re-constructs the pipeline.
- Math is off by default. Set `math: true` for always-on, `math: 'auto'` for lazy detection, and leave it off when you never author math.
- Custom `remark`/`rehype` plugins should be side-effect free on the tree they receive. Wrapping or reordering large subtrees is fine; reading from disk inside a plugin is not.

## Verify

1. Run the dev server and open a page that uses the feature (Mermaid fence, math, new language).
2. `npx vite build` — confirm no warnings about missing grammars, invalid Shiki themes, or unsupported plugin outputs.
3. Check the emitted HTML for the expected class names or `data-*` attributes your plugin adds.

## Gotchas

- Plugins imported from CommonJS-only packages may crash the pipeline. Prefer ESM-first plugins.
- Shiki dual themes require both themes to be available at build time. If you ship a custom JSON theme, make sure the path resolves from `node_modules`.
- `math: true` adds ~75 KB of KaTeX assets on every page. Use `'auto'` unless every page has math.
- The `langAlias` map is for Shiki only. Markdown fences like ` ```vue ` still need the alias to look up a valid grammar.
- If a plugin mutates heading text, run it **before** the `slug`/`autolink-headings` steps — which means it goes in `remarkPlugins`, not `rehypePlugins`.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `./references/markdown-guidelines.md`
- `./references/usage.md`
- Sibling skills: `pagesmith-core-add-collection`, `pagesmith-core-write-validator`.
