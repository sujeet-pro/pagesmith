---
title: Markdown Features
description: Built-in markdown pipeline features — alerts, smart typography, external links, accessible emojis, GFM, and math.
---

# Markdown Features

Pagesmith's markdown pipeline includes several remark and rehype plugins that are enabled by default. No configuration is needed to use any of these features.

## GitHub Alerts

Use GitHub-flavored alert syntax for callouts, notes, and warnings:

```markdown
> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Negative potential consequences of an action.
```

Alerts render as styled callout boxes with an icon and colored left border. The five types are:

| Type | Color | Use For |
|---|---|---|
| `[!NOTE]` | Blue | General information |
| `[!TIP]` | Green | Helpful suggestions |
| `[!IMPORTANT]` | Purple | Key details |
| `[!WARNING]` | Yellow | Things to watch out for |
| `[!CAUTION]` | Red | Dangerous actions or breaking changes |

This uses the same syntax as [GitHub's alert blockquotes](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts), so your markdown renders consistently on GitHub and in Pagesmith.

## External Links

Any link with an absolute URL (starting with `http://` or `https://`) automatically gets `target="_blank"` and `rel="noopener noreferrer"` added. This ensures external links open in a new tab without leaking referrer information.

```markdown
[GitHub](https://github.com)        <!-- opens in new tab -->
[Internal page](/guide/getting-started)  <!-- stays in same tab -->
```

Internal links (relative paths, anchor links) are not affected. This behavior is built into the pipeline via `rehype-external-links` and requires no configuration.

## Smart Typography

Pagesmith automatically converts ASCII typography to proper typographic characters:

| Input | Output | Character |
|---|---|---|
| `"hello"` | \u201chello\u201d | Curly double quotes |
| `'hello'` | \u2018hello\u2019 | Curly single quotes |
| `--` | \u2014 | Em dash |
| `---` | \u2014 | Em dash |
| `...` | \u2026 | Ellipsis |

This is handled by `remark-smartypants` and runs on all prose text. Code blocks and inline code are not affected.

## Accessible Emojis

Emoji characters in your markdown are automatically wrapped in accessible markup:

```markdown
Great job! 🎉
```

Renders as:

```html
Great job! <span role="img" aria-label="party popper">🎉</span>
```

The `role="img"` and `aria-label` attributes ensure screen readers announce the emoji's meaning instead of ignoring it or reading a generic description.

## GitHub Flavored Markdown

GFM features are enabled by default via `remark-gfm`:

### Tables

```markdown
| Feature | Status |
|---------|--------|
| Tables  | Yes    |
| Strikethrough | Yes |
```

### Strikethrough

```markdown
~~deleted text~~
```

### Task Lists

```markdown
- [x] Completed task
- [ ] Pending task
```

### Autolinks

Bare URLs are automatically linked:

```markdown
Visit https://pagesmith.dev for docs.
```

### Footnotes

```markdown
Content with a footnote[^1].

[^1]: This is the footnote content.
```

## Math

LaTeX math is supported via `remark-math` and `rehype-mathjax`:

### Inline Math

```markdown
The equation $E = mc^2$ is famous.
```

### Display Math

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

## Heading IDs and Anchors

All headings automatically receive:

1. A URL-safe `id` attribute (via `rehype-slug`)
2. The heading text wrapped in an anchor link (via `rehype-autolink-headings`)

```markdown
## My Section
```

Renders as:

```html
<h2 id="my-section"><a href="#my-section">My Section</a></h2>
```

## Custom Plugins

You can add your own remark and rehype plugins via `MarkdownConfig`:

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

Custom remark plugins run after the built-in remark plugins (GFM, math, frontmatter, alerts, smartypants) but before `remark-rehype`. Custom rehype plugins run after the built-in rehype plugins but before `rehype-stringify`.

## Pipeline Order

The full pipeline, in order:

```text
remark-parse              Parse markdown to AST
remark-gfm                Tables, strikethrough, task lists, autolinks, footnotes
remark-math               Math syntax ($...$, $$...$$)
remark-frontmatter        Strip YAML frontmatter from AST
remark-github-alerts      > [!NOTE], > [!TIP], etc.
remark-smartypants        Smart quotes, dashes, ellipses
[user remark plugins]     From MarkdownConfig.remarkPlugins
remark-rehype             Markdown AST → HTML AST
rehype-expressive-code    Syntax highlighting, code frames, copy button
rehype-mathjax            Render math to SVG
rehype-slug               Add id="" to headings
rehype-autolink-headings  Wrap heading text in anchor links
rehype-external-links     target="_blank" on external URLs
rehype-accessible-emojis  aria-label on emoji characters
heading extraction        Collect headings for TOC
[user rehype plugins]     From MarkdownConfig.rehypePlugins
rehype-stringify          HTML AST → HTML string
```
