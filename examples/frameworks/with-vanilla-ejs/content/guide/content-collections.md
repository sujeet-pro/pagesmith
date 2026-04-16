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

Content collections are the bridge between your markdown files and your template rendering code. Each collection maps a directory of markdown files to a typed schema, and Pagesmith validates frontmatter at build time.

## Defining collections

Collections are defined in `content.config.mjs` using `defineCollection` and `defineCollections` from `@pagesmith/site`:

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

## Why `.mjs`?

This example uses `content.config.mjs` instead of the `.ts` variant used by framework examples. The `.mjs` extension ensures the file is treated as plain ESM without requiring a TypeScript build step. The `createContentLayer` API in the SSR entry imports it directly:

```ts title="src/entry-server.tsx (excerpt)"
// @ts-expect-error -- the example intentionally keeps the content config as .mjs
import contentConfig from '../content.config.mjs'
```

The `@ts-expect-error` comment suppresses the TypeScript error from importing a `.mjs` file in a `.tsx` context -- this is intentional and harmless.

## How schemas work

Each collection's `schema` property is a Zod object that validates the YAML frontmatter in every markdown file. If a file's frontmatter does not match the schema, the build fails with a clear error message.

Key patterns used in this example:

- **`z.coerce.date()`** -- Accepts date strings in frontmatter (e.g., `2026-03-20`) and coerces them into `Date` objects.
- **`z.array(z.string()).default([])`** -- Tags default to an empty array when omitted.
- **`z.string().optional()`** -- Fields like `description` and `series` are not required.

The `z` import is re-exported from `@pagesmith/site`, so you do not need to install Zod separately.

## Using `createContentLayer`

Unlike the React, Solid, or Svelte examples that use virtual modules via `pagesmithContent`, the EJS example uses `createContentLayer` directly from `@pagesmith/site` to load content at build time:

```ts title="src/entry-server.tsx (excerpt)"
import { createContentLayer } from '@pagesmith/site'

const { guide, pages } = contentConfig as Record<string, any>

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

The layer is created once and reused across renders. Collections are accessed via `layer.getCollection('guide')`, which returns an array of entry objects. Each entry provides:

- **`entry.data`** -- The validated frontmatter matching the collection's Zod schema
- **`entry.slug`** -- The filename-based slug (e.g., `installation`)
- **`entry.render()`** -- An async function that returns `{ html, headings, readTime }`
