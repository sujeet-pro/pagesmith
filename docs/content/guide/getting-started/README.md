# Getting Started

Pagesmith works best when you treat content as typed data first and rendered HTML second. The core workflow is:

1. Define collections.
2. Point them at filesystem directories.
3. Load them through a content layer.
4. Render only the entries you need.

## Install

```bash
npm add @pagesmith/core diagramkit
```

For local development against a local `diagramkit` checkout:

```bash
npm run link:diagramkit
```

## Create a Content Config

```ts
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

const authors = defineCollection({
  loader: 'json',
  directory: 'content/authors',
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
  }),
})

export const contentConfig = defineConfig({
  collections: { posts, authors },
  diagrams: {
    enabled: true,
    displayMode: 'picture',
  },
})

const layer = createContentLayer(contentConfig)
```

## Recommended Content Layout

```text
content/
  posts/
    hello-world/
      README.md
      overview.mermaid
      hero.png
  authors/
    jane-doe.json
```

Folder-based entries are the safest default whenever a markdown entry references sibling assets or diagrams.

## Load and Render

```ts
const posts = await layer.getCollection('posts')

for (const post of posts) {
  console.log(post.slug, post.data.title)

  const rendered = await post.render()
  console.log(rendered.html)
  console.log(rendered.headings)
  console.log(rendered.readTime)
}
```

## Validate and Render Diagrams

```ts
const validation = await layer.validate()
await layer.renderDiagrams()
```

From the CLI:

```bash
pagesmith diagrams content/
```

## What to Read Next

- [/guide/collections-and-loaders](/guide/collections-and-loaders)
- [/guide/validation-and-rendering](/guide/validation-and-rendering)
- [/guide/diagramkit](/guide/diagramkit)
- [/guide/ai-assistants](/guide/ai-assistants)
