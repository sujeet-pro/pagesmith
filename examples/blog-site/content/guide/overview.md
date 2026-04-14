---
title: Overview
description: How the blog-site example differs from framework examples
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Overview

This example is a static site built from **`@pagesmith/site`**: no React, Solid, or Svelte, and no `pagesmithContent` Vite plugin. You define collections with `defineCollection` / `defineConfig`, construct a layer with `createContentLayer`, load entries with `layer.getCollection(...)`, and turn Markdown into HTML with **`await entry.render()`** (the same markdown pipeline other examples use — this path does not call `processMarkdown` directly in app code).

## End-to-end flow

1. **Vite** loads `vite.config.ts`: `sharedAssetsPlugin()` plus `pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] })`.
2. **SSG** imports the entry module and calls **`getRoutes(renderConfig)`** to enumerate URLs, then **`render(url, renderConfig)`** per route. Those two exports are the contract `pagesmithSsg` expects.
3. **Content** — Inside `render`, this example’s `loadSite()` builds a content layer for `config.root`, fetches each collection, and pre-renders Markdown via **`renderEntries()` → `entry.render()`** so layout code receives `html`, `headings`, and `readTime`.
4. **Shell** — Layout is JSX from `@pagesmith/site/jsx-runtime`, converted to strings and wrapped by `renderDocument()` (full HTML document including CSS/JS links and optional Pagefind markup).
5. **Browser** — `client.js` imports bundled CSS and `src/runtime.ts` for TOC, sidebar modal, theme persistence, and search UI affordances.

See `content/guide/build-and-deploy.md` for build output paths and dev commands.

## How it differs from framework examples

The React example wires three plugins:

```ts title="with-react/vite.config.ts"
plugins: [
  sharedAssetsPlugin(),
  pagesmithContent({ collections }),
  ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
]
```

This example uses two — no `pagesmithContent`:

```ts title="blog-site/vite.config.ts"
plugins: [
  sharedAssetsPlugin(),
  ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
]
```

| Framework-style (`pagesmithContent`) | Direct API (this example) |
|--------------------------------------|---------------------------|
| Collections often live in `content.config.ts` and load through virtual modules | Collections are defined in `src/content.ts` alongside `createContentLayer` |
| Bundler imports typed collection modules | Node-side `getCollection` + `entry.render()` at SSG time |
| Same markdown pipeline once content is loaded | Same pipeline via `entry.render()` |

## Why use this approach?

- **No framework** — `@pagesmith/site/jsx-runtime` SSRs static HTML; no hydration model.
- **Explicit data flow** — You choose when to call `getCollection`, how to sort, and how to map entries to routes.
- **Smaller plugin surface** — Fewer moving parts in Vite; trade-off is more entry-file code than virtual imports.
