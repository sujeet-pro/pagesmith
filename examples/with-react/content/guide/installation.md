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

Two Pagesmith plugins handle the heavy lifting:

1. **`pagesmithContent`** -- Processes markdown files, validates frontmatter against Zod schemas, and exposes each collection as a virtual module (e.g., `virtual:content/guide`).
2. **`pagesmithSsg`** -- Runs the SSR entry at build time to produce static HTML files, sets up dev middleware for live reload, and indexes the output with Pagefind.

A third plugin, `sharedAssetsPlugin`, copies font files and other shared assets into the build output.

These three plugins are the only Pagesmith-specific configuration needed -- everything else is standard Vite.
