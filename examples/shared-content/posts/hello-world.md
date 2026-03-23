---
title: Hello World
description: Your first post using the Pagesmith content layer
date: 2026-03-01
tags: [intro, getting-started]
author: jane-doe
---

# Hello World

Welcome to your first post using the **Pagesmith content layer**. This library transforms your markdown files into structured, validated content ready for any frontend framework.

## What is @pagesmith/content?

It's a framework-agnostic content CMS library that handles:

- Schema-validated collections with [Zod](https://zod.dev)
- Markdown rendering with syntax highlighting
- Lazy content loading and caching
- Multiple content formats (Markdown, JSON, YAML, TOML)

## Quick Example

```typescript title="content.config.ts"
import { defineCollection, z, } from '@pagesmith/content'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string(),),
  },),
},)
```

Then load and render your content:

```typescript title="build.ts"
import { createContentLayer, } from '@pagesmith/content'

const layer = await createContentLayer(config,)
const posts = await layer.getCollection('posts',)

for (const post of posts) {
  const { html, headings, } = await post.render()
  // Use html in your templates
}
```

## Next Steps

Check out the [Getting Started](/getting-started) guide for a full walkthrough.
