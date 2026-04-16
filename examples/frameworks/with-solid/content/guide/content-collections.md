---
title: Content Collections
description: Typed markdown collections and virtual modules used by the Solid SSR entry
date: 2026-03-18
tags:
  - content
  - schema
series: Getting Started
seriesOrder: 3
---

# Content Collections

Collections connect filesystem markdown to **typed, build-time** data. This example keeps the collection definitions in **`content.config.ts`** and imports the generated virtual modules only from **`src/entry-server.tsx`**.

## Definition

```ts title="content.config.ts"
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

`z` is re-exported from `@pagesmith/site`; you do not add Zod as a separate dependency for schemas.

## Virtual modules

`pagesmithContent({ collections })` registers one module per collection key:

| Key        | Import                          |
| ---------- | ------------------------------- |
| `guide`    | `virtual:content/guide`         |
| `pages`    | `virtual:content/pages`         |

Each export is an **array of entries** with (among other fields) `contentSlug`, **`html`** (already rendered markdown), **`headings`**, and **`frontmatter`** validated against the schema.

## SSR usage

The entry sorts and routes on those arrays — it does not call the markdown pipeline itself at runtime. Type hints for the virtual imports come from **`src/pagesmith-content.d.ts`**, which the content plugin regenerates.

For the Solid rendering contract, see [Layouts & Rendering](./layouts-and-rendering).
