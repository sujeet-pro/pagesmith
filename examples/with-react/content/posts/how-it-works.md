---
title: How It Works
description: Understanding the Vite+ and Pagesmith SSG pipeline
date: 2026-03-10
tags:
  - architecture
  - ssr
order: 2
---

# How the Build Pipeline Works

The Pagesmith + React example produces a fully static site through `vp build`. Pagesmith layers its SSG step on top of the standard Vite+ client build, so one command produces bundled assets, rendered HTML, copied content assets, and a Pagefind search index.

## Phase 1: Client bundle

Vite+ compiles the browser-facing assets from `index.html`, `client.js`, and the shared theme CSS. This produces the CSS bundle, the small client runtime used for search/code-copy/TOC behavior, and the static asset manifest.

## Phase 2: SSR bundle

`pagesmithSsg(...)` asks Vite+ for a server bundle targeting `src/entry-server.tsx`. That module exports two important functions:

1. `getRoutes()` returns the list of URLs to pre-render.
2. `render(url, config)` returns the HTML for a single route.

Inside the example, the server entry imports `virtual:content/blog`, `virtual:content/guide`, and `virtual:content/pages`, then uses `react-dom/server` to turn React components into static HTML strings.

## Phase 3: Pre-rendering

After the SSR bundle is ready, Pagesmith:

1. Calls `getRoutes()`.
2. Renders each route through `render(url, config)`.
3. Writes the result to the output directory as `.html` files.
4. Copies referenced content assets.
5. Builds a Pagefind index from the generated HTML.

Because routes come directly from the content collections, adding a new markdown file automatically adds a new page to the build.

## Base URL handling

Both the server entry and the output HTML use the configured `base` path. The renderer normalizes incoming URLs against that base so links, styles, search assets, and the generated static pages all work when deployed under `/pagesmith/examples/react/`.
