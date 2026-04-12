---
title: Markdown Features
description: Overview of Pagesmith's built-in markdown pipeline, with example-driven guides for alerts, GFM, typography, math, and code blocks.
---

# Markdown Features

Pagesmith ships with a rich markdown pipeline by default. You can write standard markdown, GitHub-style alerts, GitHub Flavored Markdown extensions, LaTeX math, and advanced code block metadata without wiring up your own plugin stack.

No extra configuration is required to use the built-in features. The pages in this section are organized as feature-focused demos so you can see realistic rendered output instead of only API notes.

## Feature Guides

- [Alerts & Callouts](/guide/alerts-and-callouts) - GitHub-style callouts, multi-paragraph notes, lists, and code blocks inside alerts
- [GFM Extensions](/guide/gfm-extensions) - tables, task lists, strikethrough, autolinks, and footnotes
- [Typography](/guide/typography) - headings, links, images, blockquotes, lists, and smart punctuation
- [Math & LaTeX](/guide/math-and-latex) - inline and display equations rendered with MathJax
- [Code Blocks](/guide/code-blocks) - titles, line numbers, highlighting, diff markers, collapse, and tabs

## Built In By Default

| Feature | Plugin or stage | Where to explore it |
|---|---|---|
| Alerts | `remark-github-alerts` | [Alerts & Callouts](/guide/alerts-and-callouts) |
| GitHub Flavored Markdown | `remark-gfm` | [GFM Extensions](/guide/gfm-extensions) |
| Smart typography | `remark-smartypants` | [Typography](/guide/typography) |
| Math | `remark-math`, `rehype-mathjax` | [Math & LaTeX](/guide/math-and-latex) |
| Code blocks | built-in Pagesmith renderer on top of Shiki | [Code Blocks](/guide/code-blocks) |
| External link handling | `rehype-external-links` | Overview below |
| Heading anchors | `rehype-slug`, `rehype-autolink-headings` | Overview below |
| Accessible emojis | `rehype-accessible-emojis` | Overview below |

## External Links

Any link with an absolute URL (starting with `http://` or `https://`) automatically gets `target="_blank"` and `rel="noopener noreferrer"`. Internal links and anchor links are left alone.

```markdown
[GitHub repository](https://github.com/sujeet-pro/pagesmith)
[Getting Started](/guide/getting-started)
[Jump to code blocks](#built-in-by-default)
```

Rendered sample:

- [GitHub repository](https://github.com/sujeet-pro/pagesmith)
- [Getting Started](/guide/getting-started)
- [Jump to code blocks](#built-in-by-default)

## Accessible Emojis

Emoji characters are wrapped with accessible markup so screen readers announce their meaning instead of skipping them.

```markdown
Ship it 🚀
```

Rendered sample:

Ship it 🚀

HTML output:

```html
Ship it <span role="img" aria-label="rocket">🚀</span>
```

## Heading IDs and Anchors

All headings automatically receive:

1. A URL-safe `id` via `rehype-slug`
2. A self-link via `rehype-autolink-headings`

```markdown
## My Section
```

This renders to HTML like:

```html
<h2 id="my-section"><a href="#my-section">My Section</a></h2>
```

## Custom Plugins

You can extend the built-in pipeline with your own remark and rehype plugins through `MarkdownConfig`:

```ts
import remarkToc from 'remark-toc'
import rehypeFigure from 'rehype-figure'

const config = defineConfig({
  collections: { posts },
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [rehypeFigure],
  },
})
```

Custom remark plugins run after the built-in remark plugins but before `remark-rehype`. Custom rehype plugins run after the built-in rehype plugins but before `rehype-stringify`.

## Pipeline Order

The full pipeline, in order:

```text
remark-parse              Parse markdown to AST
remark-gfm                Tables, strikethrough, task lists, autolinks, footnotes
remark-frontmatter        Strip YAML frontmatter from AST
remark-github-alerts      > [!NOTE], > [!TIP], etc.
remark-smartypants        Smart quotes, en/em dashes, ellipses
remark-math (optional)    Enabled when `markdown.math` is `true` or `'auto'` detects math markers
[user remark plugins]     From MarkdownConfig.remarkPlugins
lang-alias transform      Map fenced-code language tags via markdown.shiki.langAlias
remark-rehype             Markdown AST -> HTML AST
rehype-mathjax            Render math to SVG before code rendering when math is enabled
applyPagesmithCodeRenderer Syntax highlighting, code frames, copy button
rehype-code-tabs          Group consecutive titled blocks into tabs
rehype-scrollable-tables  Wrap markdown tables for horizontal scrolling
rehype-slug               Add id="" to headings
rehype-autolink-headings  Wrap heading text in anchor links
rehype-external-links     target="_blank" on external URLs
rehype-accessible-emojis  aria-label on emoji characters
heading extraction        Collect headings for TOC
[user rehype plugins]     From MarkdownConfig.rehypePlugins
rehype-stringify          HTML AST -> HTML string
```

For validation details and lifecycle notes, see [Validation & Rendering](/guide/validation-and-rendering).
