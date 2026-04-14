---
title: Content Layer Usage
description: How this example uses createContentLayer() and entry.render() to load and render markdown
date: 2026-03-20
tags:
  - content
---

# Content Layer Usage

The core of this example lives in `lib/content.js`. It creates a `ContentLayer` instance and exposes two functions for Next.js pages to call.

## Defining Collections

Collections are defined in `content.config.js` using Pagesmith's schema helpers from `@pagesmith/site`:

```js title="content.config.js"
import { defineCollection, defineCollections, z } from '@pagesmith/site'

export const posts = defineCollection({
  loader: 'markdown',
  directory: './content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export default defineCollections({ posts })
```

## Creating the Layer

`lib/content.js` creates the `ContentLayer` once at module scope and reuses it across lookups:

```js title="lib/content.js"
import { createContentLayer, defineConfig } from '@pagesmith/site'
import collections from '../content.config.js'

let layer

function getLayer() {
  if (!layer) {
    layer = createContentLayer(
      defineConfig({ root: process.cwd(), collections }),
    )
  }
  return layer
}
```

## Fetching and Rendering

Two helpers expose the content to Next.js pages:

- **`getAllPosts()`** — loads the entire `posts` collection, renders each entry to HTML, and sorts by date.
- **`getPostBySlug(slug)`** — fetches a single entry and renders it.

Each call to `entry.render()` runs the markdown through Pagesmith's unified pipeline (syntax highlighting, code blocks, GFM, etc.) and returns `{ html, headings, readTime }`.

## Using in Pages

The home page (`app/page.js`) calls `getAllPosts()` directly in a server component:

```js
import { getAllPosts } from '../lib/content.js'

export default async function HomePage() {
  const posts = await getAllPosts()
  // Render post listing...
}
```

The dynamic route (`app/posts/[slug]/page.js`) uses `getPostBySlug()` and injects the rendered HTML via `dangerouslySetInnerHTML`:

```js
import { getPostBySlug, getAllPosts } from '../../../lib/content.js'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```
