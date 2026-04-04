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

Content collections are the bridge between your markdown files and your rendering code. Each collection maps a directory of markdown files to a typed schema, and Pagesmith exposes them as virtual modules that can be imported directly in your components.

## Defining collections

Collections are defined in `content.config.ts` using `defineCollection` and `defineCollections` from `@pagesmith/core`:

```ts title="content.config.ts"
import { defineCollection, defineCollections, z } from '@pagesmith/core'

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

export const blog = defineCollection({
  loader: 'markdown',
  directory: './content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
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

export default defineCollections({ guide, blog, pages })
```

## How schemas work

Each collection's `schema` property is a Zod object that validates the YAML frontmatter in every markdown file. If a file's frontmatter does not match the schema, the build fails with a clear error message.

Key patterns used in this example:

- **`z.coerce.date()`** -- Accepts date strings in frontmatter (e.g., `2026-03-20`) and coerces them into `Date` objects.
- **`z.array(z.string()).default([])`** -- Tags default to an empty array when omitted.
- **`z.string().optional()`** -- Fields like `description` and `series` are not required.

The `z` import is re-exported from `@pagesmith/core`, so you do not need to install Zod separately.

## Virtual modules

When the `pagesmithContent` Vite plugin processes these collections, it creates virtual modules named after each collection key:

| Collection key | Virtual module            |
| -------------- | ------------------------- |
| `guide`        | `virtual:content/guide`   |
| `blog`         | `virtual:content/blog`    |
| `pages`        | `virtual:content/pages`   |

Each virtual module exports an array of entry objects. Every entry contains:

- **`contentSlug`** -- The collection-prefixed slug (e.g., `guide/installation`)
- **`html`** -- The rendered HTML from the markdown pipeline
- **`headings`** -- An array of extracted headings with `depth`, `slug`, and `text`
- **`frontmatter`** -- The validated frontmatter matching the collection's Zod schema

## Importing in the SSR entry

The entry server imports these modules directly:

```ts title="src/entry-server.tsx (excerpt)"
import guideCollection from 'virtual:content/guide'
import blogCollection from 'virtual:content/blog'
import pagesCollection from 'virtual:content/pages'
```

From there, the entries are sorted, grouped, and passed into React components for rendering.

## Generated types

The content plugin also generates a TypeScript declaration file at `src/pagesmith-content.d.ts`. This file declares the virtual module types so your editor provides autocompletion and type checking for frontmatter fields, content slugs, and collection shapes. The file is regenerated automatically -- do not edit it by hand.
