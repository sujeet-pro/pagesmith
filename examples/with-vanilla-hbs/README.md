# Pagesmith + Handlebars

A content-driven static site using `@pagesmith/core` with Handlebars templates for server-side rendering. Demonstrates the content plugin flow with template-based rendering, custom helpers, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-hbs
```

## Architecture

Content is defined in `content.config.mjs` using `defineCollection` with Zod schemas. The `pagesmithContent` Vite plugin generates virtual modules imported in `entry-server.tsx`. Handlebars templates (`layout.hbs`, `index.hbs`, `article.hbs`, `about.hbs`) with custom helpers (`eq`, `startsWith`, `concat`) render pages via `Handlebars.compile()`. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Inline client-side scripts add progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-hbs/)
