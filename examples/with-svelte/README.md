# Pagesmith + Svelte

A content-driven static site using `@pagesmith/core` with Svelte 5 for server-side rendering. Demonstrates the Vite content plugin flow with `.svelte` components, virtual content imports, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:svelte
```

## Architecture

Content is defined in `content.config.ts` using `defineCollection` with Zod schemas. The `pagesmithContent` Vite plugin generates virtual modules imported in `site.ts`. Svelte components (`App.svelte`, `PageBody.svelte`, `HomeBody.svelte`, etc.) are rendered to static HTML via `render` from `svelte/server`. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Client-side `runtime.ts` adds progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/svelte/)
