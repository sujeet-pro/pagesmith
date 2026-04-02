---
title: Content Collections
description: Loading and rendering content with the content layer API
date: 2026-03-15
tags:
  - content
  - collections
order: 3
---

# Content Collections

The content layer API is the foundation of every Pagesmith integration. Whether you use React, Svelte, or plain EJS templates, the same `defineCollection` and `createContentLayer` functions handle content loading and validation.

## Defining collections

Each collection is declared with `defineCollection` from `@pagesmith/core`. The definition specifies a loader type, a directory, and a Zod schema for frontmatter validation:

```js
import { defineCollection, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})
```

The `z.coerce.date()` call is worth noting — it accepts date strings in frontmatter (like `2026-03-15`) and coerces them into proper `Date` objects. The `z.array(z.string()).default([])` pattern means tags are optional in frontmatter but always present as an array in code.

## The programmatic API

Framework examples use the Vite plugin (`pagesmithContent`) which generates virtual modules and integrates with hot module replacement. This EJS example skips all of that and calls the content layer directly:

```js
import { createContentLayer, defineConfig } from '@pagesmith/core'
import { pages, posts } from './content.config.mjs'

const layer = createContentLayer(
  defineConfig({
    root: import.meta.dirname,
    collections: { posts, pages },
  }),
)
```

The `root` option tells the content layer where to resolve the `directory` paths declared in each collection. Setting it to `import.meta.dirname` means paths are relative to the build script itself.

## Working with entries

`layer.getCollection('posts')` returns an array of `ContentEntry` objects. Each entry exposes:

- **`entry.data`** — The validated frontmatter object, fully typed according to your Zod schema. If a field fails validation, the error is thrown at load time with a clear message pointing to the offending file.
- **`entry.slug`** — A URL-safe identifier derived from the filename (e.g., `getting-started` from `getting-started.md`).
- **`entry.render()`** — An async method that processes the markdown and returns `{ html, headings, readTime }`. The `html` is the rendered markdown ready for insertion into a template. The `headings` array provides extracted heading elements for table-of-contents generation. The `readTime` value estimates reading duration.

## Schema validation matters

The Zod schema is not optional decoration — it is the contract between your content and your templates. When you access `post.data.title` in an EJS template, you know it exists and is a string because the schema enforced that at load time. Without schema validation, a missing frontmatter field would surface as `undefined` in your rendered HTML — a silent, hard-to-debug failure. With it, you get an immediate, descriptive error during the build.

This is the same validation that runs in the framework examples. The difference is only in how you trigger it: here you call `createContentLayer` directly, while framework examples let the Vite plugin handle it behind the scenes.
