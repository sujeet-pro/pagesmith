---
title: "SSR & Pre-rendering"
description: "Pre-render your content pages to static HTML for production deployment."
date: 2026-03-11
tags: [ssr, build, static]
series: framework-integration
seriesOrder: 2
---

# SSR & Pre-rendering

Pagesmith content sites can be pre-rendered to static HTML at build time. This gives you fast page loads, full SEO, and Pagefind search indexing.

## Build flow

1. **Client build** — Vite bundles your app as usual (JS, CSS, assets)
2. **SSR build** — Vite builds your entry-server module for Node
3. **Pre-render** — For each route, render HTML with the SSR module and write to disk
4. **Search index** — Run Pagefind on the output directory

```js
// build.mjs
import { build } from 'vite-plus'
import { prerenderRoutes } from '@pagesmith/core/vite'

// Step 1: Client build
await build({ root })

// Step 2: SSR build
await build({ root, build: { ssr: 'src/entry-server.tsx' } })

// Step 3: Pre-render routes
await prerenderRoutes({ outDir, serverEntry, routes })

// Step 4: Pagefind indexing
execFileSync(process.execPath, [pagefindBin, '--site', outDir])
```

## Route discovery

Build scripts discover routes from your content collections:

```js
const layer = createContentLayer({ collections: { guide, blog, pages } })
const allGuide = await layer.getCollection('guide')
const allBlog = await layer.getCollection('blog')

const routes = [
  '/',
  '/about',
  ...allGuide.map(e => `/guide/${e.slug}`),
  ...allBlog.map(e => `/blog/${e.slug}`),
]
```
