# Pagesmith + Core (No Framework)

A content-driven static site built from scratch using `@pagesmith/core` primitives — no React, Solid, Svelte, or template engine. Demonstrates that the same output as the framework examples can be achieved using `createContentLayer`, `processMarkdown`, and the `@pagesmith/core` JSX runtime directly.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:blog-site
```

## Architecture

Collections are defined inline in `entry-server.tsx` using `defineCollection` with Zod schemas. Content is loaded via `createContentLayer` (not virtual modules). Pages are rendered using `@pagesmith/core`'s built-in JSX runtime (`h()`, `Fragment`, `HtmlString`) — configured via `jsxImportSource: '@pagesmith/core'` in the Vite config. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

This is the key differentiator from framework examples: no `pagesmithContent` plugin, no virtual modules, no framework dependency. The CSS is the same as the React example, proving identical visual output.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/blog-site/)
