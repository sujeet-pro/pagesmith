---
title: Getting Started
description: Setting up Pagesmith with EJS templates
date: 2026-03-01
tags:
  - setup
  - ejs
order: 1
---

# Getting Started with Pagesmith + EJS

This example uses `@pagesmith/core` for content, `ejs` for templating, and Vite+ for the dev/build pipeline. There is still no client-side framework runtime, but the site now builds through the same `vp dev` / `vp build` workflow as the rest of the repo.

## Install dependencies

```bash
vp install @pagesmith/core ejs pagefind
vp install -D vite-plus typescript
```

EJS still handles the final HTML rendering at build time. Pagesmith handles content loading, markdown rendering, validation, and the static-site build pipeline.

## Define your content schema

Create a `content.config.mjs` at the project root. This file uses `defineCollection` and `z` (Zod) from `@pagesmith/core` to declare what your content looks like:

```js
import { defineCollection, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})
```

The schema validates every markdown file's frontmatter at load time. If a required field is missing or has the wrong type, you get a clear error immediately — not a broken page at runtime.

## The server entry

The `src/entry-server.tsx` file is the heart of this example. It uses the programmatic `createContentLayer` API together with `pagesmithSsg(...)`. The flow is straightforward:

1. Import your collection definitions from `content.config.mjs`
2. Create a content layer with `createContentLayer(defineConfig({ collections, root }))`
3. Load collections with `layer.getCollection('posts')`
4. Render each entry's markdown with `entry.render()`
5. Pass the rendered HTML into EJS templates
6. Return the final HTML to Pagesmith so it can write the route output, copy content assets, and run Pagefind

## EJS template syntax

EJS provides three tag types that cover everything you need:

- `<%= value %>` — escaped output (safe for user content)
- `<%- html %>` — raw/unescaped output (used for rendered markdown HTML)
- `<% if (condition) { %>` — control flow (loops, conditionals)

The raw output tag `<%- %>` is essential here because `post.render()` returns processed HTML that should not be double-escaped.

## Build and preview

```bash
vp build
```

This produces a directory of static HTML files ready to serve from any static host. There is no client framework hydration step, but you still get the shared Pagesmith runtime features and search indexing.
