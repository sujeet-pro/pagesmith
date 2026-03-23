---
title: Advanced Features
description: Custom loaders, caching, schema validation, and multi-format content
date: 2026-03-15
tags: [advanced, loaders, validation]
author: jane-doe
---

# Advanced Features

Once you're comfortable with the basics, explore these advanced capabilities.

## Multiple Content Formats

Beyond markdown, `@pagesmith/content` supports data-only collections:

### JSON Collections

```typescript
const authors = defineCollection({
  loader: 'json',
  directory: 'content/authors',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
  },),
},)
```

### YAML Collections

```typescript
const settings = defineCollection({
  loader: 'yaml',
  directory: 'content/config',
  schema: z.object({
    theme: z.string(),
    features: z.array(z.string(),),
  },),
},)
```

### TOML Collections

```typescript
const metadata = defineCollection({
  loader: 'toml',
  directory: 'content/meta',
  schema: z.object({
    version: z.string(),
    authors: z.array(z.string(),),
  },),
},)
```

## Custom Loaders

Implement the `Loader` interface for any format:

```typescript
import type { Loader, } from '@pagesmith/content'

const csvLoader: Loader = {
  name: 'csv',
  extensions: ['.csv',],
  load(filePath,) {
    const raw = readFileSync(filePath, 'utf-8',)
    const rows = raw.split('\n',).map(line => line.split(',',))
    const headers = rows[0]
    const data = rows.slice(1,).map(row => Object.fromEntries(headers.map((h, i,) => [h, row[i],]),))
    return { data: { items: data, }, }
  },
}
```

## Computed Fields

Derive values from entry content or metadata:

```typescript
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  },),
  computed: {
    readTime: (entry,) =>
      Math.ceil(
        (entry.content?.split(/\s+/,).length ?? 0) / 200,
      ),
    year: (entry,) => new Date(entry.data.date,).getFullYear(),
    slug: (entry,) => entry.slug,
  },
},)
```

## Cache Invalidation

The content layer caches entries in memory. For development servers or watch-mode builds, invalidate on file changes:

```typescript
// Invalidate a single entry
layer.invalidate('posts', 'hello-world',)

// Invalidate an entire collection
layer.invalidateCollection('posts',)

// Invalidate everything
layer.invalidateAll()
```

## Filtering and Transforms

### Filtering

Exclude entries based on conditions:

```typescript
const posts = defineCollection({
  // ...
  filter: (entry,) => !entry.data.draft || process.env.NODE_ENV !== 'production',
},)
```

### Pre-validation Transforms

Modify data before schema validation:

```typescript
const posts = defineCollection({
  // ...
  transform: (entry,) => {
    // Normalize tags to lowercase
    entry.data.tags = entry.data.tags?.map(t => t.toLowerCase())
    return entry
  },
},)
```

## Direct Markdown Conversion

Convert markdown without a collection:

```typescript
const result = await layer.convert('# Hello\n\nWorld',)
// result.html, result.toc, result.frontmatter
```
