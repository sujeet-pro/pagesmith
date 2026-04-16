---
title: Content Collections
description: Defining typed content with Zod schemas
date: 2026-03-18
tags:
  - content
  - schema
series: Getting Started
seriesOrder: 3
---

# Content Collections

Collections connect markdown files on disk to typed frontmatter and `entry.render()` output used in Handlebars.

## Defining collections

`content.config.mjs` uses the app-facing exports from `@pagesmith/site`:

```js title="content.config.mjs"
import { defineCollection, defineCollections, z } from '@pagesmith/site'

export const guide = defineCollection({
  loader: 'markdown',
  directory: './content/guide',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
})

export const pages = defineCollection({
  loader: 'markdown',
  directory: './content/pages',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export default defineCollections({ guide, pages })
```

## Why `.mjs`

The SSR entry imports this file directly. Using `.mjs` avoids needing the config compiled as TypeScript before Vite runs.

```ts title="src/entry-server.tsx (excerpt)"
// @ts-expect-error -- the example intentionally keeps the content config as .mjs
import contentConfig from '../content.config.mjs'
```

## Schemas and validation

Zod validates frontmatter when entries load. Typical patterns: `z.coerce.date()` for ISO date strings, `.default([])` for optional arrays, `.optional()` for optional strings.

## `createContentLayer` in this example

The layer is memoized **per project root** so dev re-renders do not reconstruct it unnecessarily when only templates change:

```ts title="src/entry-server.tsx (excerpt)"
let layer: ReturnType<typeof createContentLayer>
let layerRoot: string

function getLayer(root: string) {
  if (!layer || layerRoot !== root) {
    layerRoot = root
    layer = createContentLayer({ collections: { guide, pages }, root })
  }
  return layer
}
```

Entries from `getCollection(name)` expose `entry.data`, `entry.slug`, and `await entry.render()` → `{ html, headings, readTime }` for templates.
