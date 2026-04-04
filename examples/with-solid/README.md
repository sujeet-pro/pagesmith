# Pagesmith + Solid

A content-driven static site using `@pagesmith/core` with SolidJS (`solid-js/web`) for server-side rendering. Demonstrates the Vite content plugin flow with Solid components, virtual content imports, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:solid
```

## Architecture

Content is defined in `content.config.ts` using `defineCollection` with Zod schemas. The `pagesmithContent` Vite plugin generates virtual modules that the SSR entry imports. Solid components using `For`, `Show`, and `renderToString` render each page to static HTML. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Client-side `runtime.ts` adds progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/solid/)
