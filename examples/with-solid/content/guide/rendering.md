---
title: "Rendering Content"
description: "Render markdown entries to HTML with the content layer API."
date: 2026-03-03
tags: [rendering, markdown]
series: getting-started
seriesOrder: 3
---

# Rendering Content

Content entries expose a lazy `render()` method that processes markdown through the full pipeline — syntax highlighting, math, heading extraction, and read-time estimation.

## Basic rendering

```ts
import posts from 'virtual:content/posts'

const post = posts.find(p => p.id === 'hello-world')
// In the Vite plugin flow, html and headings are pre-rendered:
console.log(post.html)      // rendered HTML string
console.log(post.headings)  // [{ depth: 2, text: '...', slug: '...' }]
```

## Using the content layer directly

```ts
import { createContentLayer } from '@pagesmith/core'

const layer = createContentLayer({ collections: { posts } })
const entries = await layer.getCollection('posts')

for (const entry of entries) {
  const { html, headings, readTime } = await entry.render()
  // html: fully rendered HTML
  // headings: extracted h2/h3 for table of contents
  // readTime: estimated minutes to read
}
```

## Markdown pipeline

The pipeline runs:
1. Parse markdown (remark)
2. GFM tables, task lists, strikethrough
3. Math blocks (KaTeX/MathJax)
4. Convert to HTML (rehype)
5. Syntax highlighting (Shiki dual themes)
6. Code tabs for consecutive fenced blocks
7. Heading ID generation and autolinks
8. Custom remark/rehype plugins you add
