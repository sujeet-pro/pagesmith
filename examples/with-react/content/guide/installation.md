---
title: Installation
description: Setting up the Pagesmith React example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This guide walks through setting up a static site that uses **React** for rendering and **Pagesmith** for the content layer. The example produces a fully static site -- no client-side React runtime ships to the browser.

## Dependencies

The project requires three groups of packages:

**Content layer** -- `@pagesmith/core` provides the markdown pipeline, collection schemas, virtual modules, and Vite plugins:

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/core": "*",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "pagefind": "^1.3.0"
  }
}
```

**React** -- `react` and `react-dom` are used exclusively at build time. `renderToStaticMarkup` converts JSX components into HTML strings during static generation.

**Pagefind** -- listed as a dependency so the SSG plugin can index generated pages and produce a search index automatically.

## Quick start

Clone the repository and install from the workspace root:

```bash
git clone https://github.com/sujeet-pro/pagesmith.git
cd pagesmith
vp install
```

Run the development server for this example:

```bash
vp run dev:eg:react
```

Or build for production:

```bash
cd examples/with-react
vp build
```

The production build writes to `gh-pages/examples/react/` (configured via `build.outDir` in the Vite config).

## What the Vite plugins provide

1. **`pagesmithContent`** — Markdown pipeline, Zod validation, and **`virtual:content/<collection>`** modules consumed by **`src/entry-server.tsx`**.
2. **`pagesmithSsg`** — Imports the entry, calls **`getRoutes()`** / **`render()`**, writes HTML, runs **Pagefind** on the output, and sets **`searchEnabled`** in **`SsgRenderConfig`** when appropriate.
3. **`sharedAssetsPlugin`** — Copies shared core assets (fonts, etc.) into the build.

Everything else is normal Vite (client entry, CSS, TypeScript).

## Build-time React vs browser bundle

- **Build** — React + **`renderToStaticMarkup`** turn JSX into HTML strings. **`renderDocumentShell`** wraps them in a full document (meta, styles, optional Pagefind shell, **`client.js`** script).
- **Browser** — **`client.js`** loads **`theme.css`**, **`@pagesmith/core/runtime/content`** (markdown/code presentation aligned with the server HTML), then **`src/runtime.ts`** for TOC, sidebar, and theme UI. There is no React hydration step.

See **Layouts & rendering** and **Search integration** for **`data-pagefind-body`** placement and Pagefind behavior.
