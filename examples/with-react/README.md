# Pagesmith + React

A content-driven static site using `@pagesmith/core` with React (`react-dom/server`) for server-side rendering. Demonstrates the Vite content plugin flow with JSX components, virtual content imports, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:react
```

## Architecture

Content is defined in `content.config.ts` using `defineCollection` with Zod schemas for typed frontmatter. The `pagesmithContent` Vite plugin generates virtual modules (`virtual:content/guide`, `virtual:content/features`, `virtual:content/pages`) that the SSR entry imports. React components (`SiteHeader`, `SidebarNav`, `HomeBody`, `PageBody`) render each page to static HTML via `renderToStaticMarkup`. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Client-side `runtime.ts` adds progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/react/)
