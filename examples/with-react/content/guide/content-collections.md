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

Content collections are the bridge between markdown on disk and your SSG entry. Each collection maps a directory to a Zod schema; `pagesmithContent` turns them into **virtual modules** your `src/entry-server.tsx` imports as plain arrays.

## Defining collections

Collections live in `content.config.ts` using `defineCollection` and `defineCollections` from `@pagesmith/site`:

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

This example uses **`guide`** for integration docs plus the single markdown regression page (`guide/kitchen-sink.md`), and **`pages`** for standalone routes like `/about`.

## How schemas work

Each collection `schema` validates YAML frontmatter. Mismatches fail the build with a clear error.

- **`z.coerce.date()`** — Frontmatter dates as strings become `Date` objects.
- **`z.array(z.string()).default([])`** — Omitted `tags` become `[]`.
- **`z.string().optional()`** — Optional fields like `description`.

`z` is re-exported from `@pagesmith/site`; you do not add Zod as a separate dependency for schemas.

## Virtual modules

For each export key on `defineCollections`, the plugin registers `virtual:content/<key>`:

| Collection key | Virtual module              |
| -------------- | --------------------------- |
| `guide`        | `virtual:content/guide`     |
| `pages`        | `virtual:content/pages`    |

Each module is an array of entries with **`contentSlug`**, **`html`**, **`headings`**, and validated **`frontmatter`**.

## Importing in the SSR entry

```ts title="src/entry-server.tsx (excerpt)"
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

The entry sorts entries, builds nav metadata, and passes strings into `renderToStaticMarkup` / `renderDocumentShell`.

## Generated types

`src/pagesmith-content.d.ts` is generated for editor support on virtual imports. Do not hand-edit; it tracks `content.config.ts`.
