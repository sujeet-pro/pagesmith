---
title: Build & Deploy
description: Building and deploying the static site
date: 2026-03-15
tags:
  - build
  - deploy
series: Core Concepts
seriesOrder: 3
---

# Build & Deploy

The blog-site example uses the same build pipeline as all Pagesmith examples: the `pagesmithSsg` Vite plugin handles static site generation and Pagefind indexing.

## Build process

Running `npm run build` in `examples/blog-site/` triggers the following sequence:

1. **Vite build** -- Bundles `client.js` into hashed CSS and JS assets
2. **SSG plugin** -- Calls `getRoutes()` to discover all URLs, then `render()` for each in parallel
3. **HTML output** -- Writes static HTML files to `gh-pages/examples/blog-site/`
4. **Pagefind** -- Indexes the generated HTML to produce a client-side search index

Each `render()` invocation reloads collections in this example (`loadSite` → `createContentLayer` → `entry.render()`), which keeps the implementation obvious for readers; production sites often cache the layer between routes if profiling shows it matters.


## The SSR entry contract

The `pagesmithSsg` plugin expects the entry file to export two functions:

```ts
export async function getRoutes(config: SsgRenderConfig): Promise<string[]>
export async function render(url: string, config: SsgRenderConfig): Promise<string>
```

**`getRoutes(config)`** returns every URL the site should generate. The config object provides `base`, `root`, and other build-time information.

**`render(url, config)`** receives a URL and config, then returns a complete HTML document string. The config includes `cssPath`, `jsPath`, and `searchEnabled` for asset references.

## Development

```bash
cd examples/blog-site
npm run dev
```

From the monorepo root you can instead run `vp run dev:eg:blog-site`, which starts the same dev server for this package.

In development mode, the SSG plugin provides middleware that calls `render()` on each request. Content changes trigger automatic re-rendering.

## Production build

```bash
cd examples/blog-site
npm run build
```

The output directory is configured in `vite.config.ts`:

```ts title="vite.config.ts (excerpt)"
build: {
  outDir: '../../gh-pages/examples/blog-site',
  emptyOutDir: true,
}
```

## Deployment

The built site is a directory of static files that can be deployed to any static hosting service. The `base` path in the Vite config determines the URL prefix for all assets and links.

For GitHub Pages, the site is deployed under `/pagesmith/examples/blog-site/`.

## Search

Search is powered by Pagefind, which runs at build time to index the generated HTML. During development, search is unavailable since Pagefind needs a completed build. The `searchEnabled` flag in the render config controls whether search UI elements are included.
