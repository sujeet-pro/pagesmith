---
title: Content Layer API
description: Loading content with createContentLayer
date: 2026-03-18
tags:
  - content
  - api
series: Getting Started
seriesOrder: 3
---

# Content Layer API

The blog-site example uses `createContentLayer` from `@pagesmith/core` to load and process content collections. This is the lower-level API that the `pagesmithContent` Vite plugin wraps internally.

## Defining collections

Collections are defined inline when creating the content layer:

```ts title="src/entry-server.tsx (excerpt)"
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

const config = defineConfig({
  collections: {
    guide: defineCollection({
      loader: 'markdown',
      directory: './content/guide',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        series: z.string().optional(),
        seriesOrder: z.number().optional(),
      }),
    }),
    features: defineCollection({
      loader: 'markdown',
      directory: './content/features',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
      }),
    }),
    pages: defineCollection({
      loader: 'markdown',
      directory: './content/pages',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
    }),
  },
})

const layer = createContentLayer(config)
```

## Loading entries

Each collection is loaded asynchronously. Entries are `ContentEntry` objects with typed frontmatter data and a lazy `render()` method:

```ts
const entries = await layer.getCollection('guide')

for (const entry of entries) {
  console.log(entry.slug)          // e.g. "overview"
  console.log(entry.data.title)    // validated frontmatter

  const rendered = await entry.render()
  console.log(rendered.html)       // processed HTML
  console.log(rendered.headings)   // extracted headings
  console.log(rendered.readTime)   // estimated read time
}
```

## Comparison with virtual modules

| Virtual modules (`pagesmithContent`) | Direct API (`createContentLayer`) |
|--------------------------------------|-----------------------------------|
| Collections defined in `content.config.ts` | Collections defined inline |
| Imported via `virtual:content/guide` | Loaded via `layer.getCollection('guide')` |
| Markdown pre-rendered at import time | Markdown rendered via `entry.render()` |
| Type declarations auto-generated | Types inferred from Zod schemas |
| Requires the `pagesmithContent` plugin | No plugin needed |

Both approaches use the same underlying markdown pipeline and produce identical HTML output.
