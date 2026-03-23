---
title: Getting Started with @pagesmith/content
description: Learn how to configure collections and render content
date: 2026-03-10
tags: [tutorial, getting-started]
author: john-doe
---

# Getting Started

This guide walks you through setting up `@pagesmith/content` from scratch.

## Installation

```bash title="Terminal"
npm install @pagesmith/content
```

## Define Your Collections

Create a `content.config.ts` file at your project root:

```typescript title="content.config.ts"
import { defineCollection, defineConfig, z, } from '@pagesmith/content'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string(),).default([],),
  },),
},)

export default defineConfig({
  collections: { posts, },
},)
```

## Create Content

Add a markdown file with YAML frontmatter:

```markdown title="content/posts/my-first-post.md"
---
title: My First Post
description: A short intro
date: 2026-03-10
tags: [blog]
---

# My First Post

Hello from **@pagesmith/content**!
```

## Load and Render

```typescript title="build.ts"
import { createContentLayer, } from '@pagesmith/content'
import config from './content.config'

const layer = await createContentLayer(config,)
const posts = await layer.getCollection('posts',)

for (const post of posts) {
  console.log(post.data.title,) // "My First Post"
  console.log(post.slug,) // "my-first-post"

  const rendered = await post.render()
  console.log(rendered.html,) // "<h1>My First Post</h1>..."
  console.log(rendered.readTime,) // 1
}
```

## Validation

All entries are validated against your Zod schema at load time. Missing or malformed fields produce clear error messages:

```typescript
const results = await layer.validate()
for (const result of results) {
  for (const entry of result.entries) {
    for (const issue of entry.issues) {
      console.error(`${entry.filePath}: ${issue.field} — ${issue.message}`,)
    }
  }
}
```

## What's Next?

- **Multiple formats**: Use JSON, YAML, or TOML loaders for data collections
- **Computed fields**: Derive values from content (read time, word count)
- **Custom loaders**: Implement the `Loader` interface for any format
- **Caching**: Entries are cached in memory — call `invalidate()` on changes
