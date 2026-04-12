# Pagesmith + Core (No Framework)

A content-driven static site built with **@pagesmith/core** only: `createContentLayer`, **`ContentEntry.render()`** for Markdown, and the package JSX runtime (`h`, `Fragment`, `innerHTML`). No React, Solid, Svelte, or template engine.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:blog-site
```

## How it fits together

| Layer | Role |
|-------|------|
| **Vite** | Bundles `client.js` (CSS + vanilla runtime). `oxc.jsx.importSource` is `@pagesmith/core` so `.tsx` in `src/` compiles to the core JSX runtime. |
| **`pagesmithSsg`** | Discovers routes via `getRoutes()`, renders each URL with `render()`, copies `public/`, runs Pagefind, writes HTML under `gh-pages/examples/blog-site/`. |
| **`createContentLayer`** | Filesystem-backed collections (`guide`, `pages`) with Zod-validated frontmatter. |
| **`entry.render()`** | Markdown → HTML for each entry (headings + read time for layout/TOC). |
| **JSX shell** | `src/entry-server.tsx` composes chrome (header, sidebar, home, article wrapper) and returns full document strings. |
| **Runtime** | `src/runtime.ts` — progressive enhancement (TOC scroll spy, sidebar dialog, theme controls, Pagefind trigger tweaks). |

**Compared to `examples/with-*`:** those examples add **`pagesmithContent`** so collections load through virtual modules and framework components render pages. Here, the SSR entry owns collection config and calls **`layer.getCollection` + `entry.render()`** instead — same Markdown output, different bundler integration.

Agent-oriented notes for this layout: `llms.txt` in this directory.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works, including `guide/kitchen-sink.md` for markdown regression |
| `content/pages/` | `pages` | Standalone pages (about) |

## Theme system

Implemented in HTML/CSS/JS in this repo (not a separate framework):

- Header theme menu and footer segmented controls (appearance, theme variant, text size)
- FOUC guard inline script reads `localStorage` key `pagesmith-theme` before paint
- Tokens and layout live in `src/theme.css` on top of `@pagesmith/core/css/content`

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/blog-site)
