---
name: customize-markdown-pipeline
description: Add custom remark / rehype plugins, themes, or options to the Pagesmith markdown pipeline without replacing the built-in defaults.
---

# Customize The Markdown Pipeline

## When To Use This

You want to:

- Inject a remark or rehype plugin (e.g. `remark-reading-time`, custom shortcodes, `rehype-mermaid`).
- Swap the Shiki themes.
- Add a language alias.
- Toggle math rendering on or off.

## Steps

1. Build a `MarkdownConfig` and pass it via `defineConfig({ markdown })`:

```ts
import type { MarkdownConfig } from '@pagesmith/core'
import remarkReadingTime from 'remark-reading-time'

export const markdown: MarkdownConfig = {
  remarkPlugins: [remarkReadingTime],
  rehypePlugins: [],
  math: 'auto',
  shiki: {
    themes: { light: 'github-light', dark: 'one-dark-pro' },
    langAlias: { vue: 'html' },
    defaultShowLineNumbers: true,
  },
}
```

2. Plug it into your config:

```ts
import { defineConfig } from '@pagesmith/core'
import collections from './content.config'
import { markdown } from './markdown.config'

export default defineConfig({ collections, markdown })
```

3. The pipeline runs in this order (customization points marked with `[user]`):

```text
parse → gfm → frontmatter → github-alerts → smartypants
  → math? → [user remark] → lang-alias → rehype
  → mathjax? → pagesmith code renderer → code-tabs → scrollable-tables
  → slug → autolink-headings → external-links → accessible-emojis → local-images
  → heading extraction → [user rehype] → stringify
```

User plugins run after the defaults, so they can rely on GFM tables, alerts, math, and code-block transforms already being applied.

## Rules

- Do not re-import `unified` directly; `@pagesmith/core` owns the processor lifecycle and caches it per `MarkdownConfig` object.
- Keep `MarkdownConfig` objects stable across renders so the processor cache can short-circuit. If you rebuild the object every call, Pagesmith will rebuild the pipeline every time.
- Math is off by default. Set `math: true` if you author math always, or `math: 'auto'` to enable only when `$...$` / `$$...$$` is detected.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/markdown-guidelines.md`
- `node_modules/@pagesmith/core/ai-guidelines/usage.md`
