# Pagesmith + EJS

A content-driven static site using `@pagesmith/core` with EJS templates for server-side rendering. Demonstrates the content plugin flow with classic template-based rendering, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-ejs
```

## Architecture

Content is defined in `content.config.mjs` using `defineCollection` with Zod schemas. The SSR entry calls `createContentLayer()` with that config and loads collections at render time (no virtual content modules). EJS templates (`layout.ejs`, `index.ejs`, `article.ejs`, `about.ejs`) render pages to HTML strings via `ejs.render()`. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Inline client-side scripts add progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-ejs/)
