---
title: "Content Layer"
description: "The core content collection API"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - api
  - content
---

# Content Layer API

The content layer is the foundation of Pagesmith. It provides type-safe content collections with schema validation.

## defineCollection

Define a content collection with a Zod schema:

```typescript
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

## createContentLayer

Create a content layer instance:

```typescript
import { createContentLayer, defineConfig } from '@pagesmith/core'

const config = defineConfig({
  collections: { posts },
})

const layer = createContentLayer(config)
```

## Working with Entries

```typescript
// Get all entries in a collection
const entries = await layer.getCollection('posts')

// Get a single entry by slug
const entry = await layer.getEntry('posts', 'hello-world')

// Render markdown to HTML
const { html, headings, readTime } = await entry.render()
```
