# @pagesmith/core

Standalone markdown-to-HTML engine with code highlighting, TOC extraction, custom JSX runtime, and CSS builder. This package has no dependencies on the rest of the monorepo — it is the foundation.

## Directory map

```
cli/bin.js               CLI entry (pagesmith-core convert)
src/
  index.ts               Barrel export
  convert.ts             Markdown-to-HTML API (convert())
  document.ts            Full HTML document generation (generateDocument())
  frontmatter.ts         YAML extraction via gray-matter
  layout-engine.ts       Apply TSX layouts to processed content
  toc.ts                 Heading extraction for table of contents
  jsx-runtime/
    index.ts             Custom h() + Fragment + HtmlString
  markdown/
    pipeline.ts          Unified processor chain (remark → rehype → shiki → stringify)
    index.ts             processMarkdown() export
    plugins/
      rehype-code-tabs.ts    CSS-only tabs from consecutive titled code blocks
      shiki-transformers.ts  Line numbers, highlights, diffs, titles, collapse
      index.ts               Re-exports
  css/
    builder.ts           LightningCSS bundling
    index.ts             Re-exports
  schemas/
    frontmatter.ts       BaseFrontmatterSchema, BlogFrontmatterSchema, ProjectFrontmatterSchema
    heading.ts           HeadingSchema (id, text, depth, children)
    config.ts            MarkdownConfigSchema (plugins, shiki config)
    index.ts             Re-exports
  styles/                CSS for standalone/content rendering
    standalone.css       All-in-one import
    content.css          Content-only import (no layout/theme)
    diagrams.css         Light/dark image switching
    viewport.css         Horizontal overflow prevention
    foundations/         reset.css, tokens.css
    content/             prose.css, toc.css
    code/                block.css, inline.css, tabs.css, line-features.css, lang-icons.css
    layout/              grid.css, sidebar.css
    components/          theme-toggle.css
  runtime/               Client-side JS (browser only)
    standalone.ts        All enhancements (theme + toc + copy-code)
    content.ts           Markdown-only enhancements (copy-code)
    copy-code.ts         Copy button for code blocks
    theme.ts             Theme toggle (light/dark persistence)
    toc-highlight.ts     Active heading highlight in TOC
  layouts/               Default standalone layout (for convert CLI)
```

## Key types

```typescript
// Markdown
MarkdownResult        // { html, headings, frontmatter }
MarkdownConfig        // { remarkPlugins?, rehypePlugins?, shiki? }

// JSX runtime
HtmlString            // Wrapper around string — h() returns this, not DOM nodes
h(tag, props, ...children) → HtmlString
Fragment(props) → HtmlString

// Convert
ConvertResult         // { html, headings, frontmatter, readTime }
ConvertOptions        // { markdown?, mode?: 'full' | 'fragment' }

// Schemas
BaseFrontmatter       // { title, description, publishedDate, lastUpdatedOn, tags, draft? }
Heading               // { id, text, depth, children: Heading[] }
```

## Markdown pipeline detail

```
gray-matter (extract frontmatter)
  → remark-parse
  → remark-gfm (tables, strikethrough, task lists, autolinks)
  → remark-math (math syntax)
  → remark-frontmatter (preserve YAML node)
  → [user remarkPlugins]
  → remark-rehype (allowDangerousHtml)
  → rehype-mathjax/svg (render math to MathML)
  → rehype-slug (heading IDs)
  → rehype-autolink-headings (wrap with anchors)
  → @shikijs/rehype (dual themes, custom transformers)
  → rehype-code-tabs (CSS-only tabbed code blocks)
  → [heading extraction for TOC]
  → [user rehypePlugins]
  → rehype-stringify (allowDangerousHtml)
```

## Custom shiki transformers

- **Line numbers** — on by default, opt out with `hideLineNumbers`
- **Line highlighting** — `mark={3,5-7}` (yellow), `ins={4}` (green), `del={5}` (red)
- **Diff markers** — `// [!code ++]` / `// [!code --]`
- **Titles** — `title="filename.ts"` shows filename above block
- **Collapse** — `collapse={1-5,12-14}` wraps lines in `<details>`
- **Language badges** — colored badges with abbreviations (TS, JS, PY, etc.)

## CSS-only code tabs

`rehype-code-tabs` detects consecutive `<figure class="code-figure">` elements with titles and groups them into a tabbed interface using hidden radio inputs + `:has()` selectors. No JavaScript required. Capped at 8 tabs.

## JSX runtime

Custom `h()` function for server-side HTML generation:

- Returns `HtmlString` (string wrapper), NOT DOM nodes
- Handles void elements (br, img, hr, etc.)
- Maps className → class, htmlFor → for
- HTML-escapes text content and attributes
- `innerHTML` prop injects raw HTML (for processed markdown)
- Component functions (tag is function) vs intrinsic elements (tag is string)
- Fragment support

## Coding conventions

- Trailing commas everywhere
- ESM imports only
- Zod schemas in `schemas/`
- The unified pipeline is async (returns Promise)
- CSS uses custom properties (--ps-*) for theming tokens
- Runtime JS is browser-only, uses vanilla DOM APIs
