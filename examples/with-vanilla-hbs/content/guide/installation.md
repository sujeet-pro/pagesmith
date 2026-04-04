---
title: Installation
description: Setting up the Pagesmith Handlebars example
date: 2026-03-20
tags:
  - setup
series: Getting Started
seriesOrder: 1
---

# Installation

This guide walks through setting up a static site that uses **Handlebars** for template rendering and **Pagesmith** for the content layer. The example produces a fully static site -- Handlebars templates are compiled and evaluated at build time, and only plain HTML ships to the browser.

## Dependencies

The project requires three groups of packages:

**Content layer** -- `@pagesmith/core` provides the markdown pipeline, collection schemas, and Vite plugins:

```json title="package.json (excerpt)"
{
  "dependencies": {
    "@pagesmith/core": "*",
    "handlebars": "^4.7.8",
    "pagefind": "^1.3.0"
  }
}
```

**Handlebars** -- The `handlebars` package provides the templating engine. Templates are compiled with `Handlebars.compile()` at build time, so no template runtime runs in the browser.

**Pagefind** -- Listed as a dependency so the SSG plugin can index generated pages and produce a search index automatically.

## Quick start

Clone the repository and install from the workspace root:

```bash
git clone https://github.com/sujeet-pro/pagesmith.git
cd pagesmith
vp install
```

Run the development server for this example:

```bash
vp run dev:eg:hbs
```

Or build for production:

```bash
cd examples/with-vanilla-hbs
vp build
```

The production build writes to `gh-pages/examples/vanilla-hbs/` (configured via `build.outDir` in the Vite config).

## What the Vite plugins provide

Two Pagesmith plugins handle the heavy lifting:

1. **`pagesmithSsg`** -- Runs the SSR entry at build time to produce static HTML files, sets up dev middleware for live reload, and indexes the output with Pagefind.
2. **`sharedAssetsPlugin`** -- Copies shared assets (fonts, icons) from `@pagesmith/core` into the build output.

Unlike the React or Solid examples, the Handlebars example does not use `pagesmithContent` for virtual modules. Instead, it uses `createContentLayer` directly in the SSR entry to load and render collections at build time. This approach gives you full control over how content is fetched and passed to templates.
