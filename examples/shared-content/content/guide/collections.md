---
title: "Defining Collections"
description: "Learn how to define content collections with loaders, schemas, and validation."
date: 2026-03-02
tags: [collections, schemas]
series: getting-started
seriesOrder: 2
---

# Defining Collections

A collection maps a filesystem directory to a typed data set. Pagesmith discovers files, loads them through the appropriate loader, validates against your Zod schema, and caches the results.

## Collection definition

```ts
import { defineCollection, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})
```

## Built-in loaders

| Loader | Extensions | Description |
|--------|-----------|-------------|
| `markdown` | `.md` | YAML frontmatter + markdown body |
| `json` | `.json` | Standard JSON |
| `yaml` | `.yml`, `.yaml` | YAML documents |
| `toml` | `.toml` | TOML files |

## Schema validation

Schemas use Zod. Every entry is validated at load time — invalid entries produce clear error messages with field paths.

```ts
const schema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
})
```

## Filtering and transforms

```ts
const published = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema,
  filter: (entry) => !entry.data.draft,
  transform: (entry) => ({
    ...entry,
    data: { ...entry.data, slug: entry.slug.toLowerCase() },
  }),
})
```
