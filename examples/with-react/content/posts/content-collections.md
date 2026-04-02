---
title: Content Collections
description: Defining and using type-safe content collections in React components
date: 2026-03-15
tags:
  - content
  - collections
order: 3
---

# Content Collections

Content collections are the core abstraction Pagesmith provides for working with structured content. A collection maps a directory of files (markdown, JSON, YAML, etc.) to a typed array of entries, each validated against a Zod schema at build time.

## Defining a collection

The `defineCollection` function from `@pagesmith/core` takes a configuration object that specifies the loader, directory, and schema:

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

The `loader` determines how files are parsed -- `'markdown'` processes `.md` files through the Pagesmith markdown pipeline, extracting frontmatter and rendering the body to HTML. The `schema` validates every entry's frontmatter, catching missing or mistyped fields before they reach your components.

## Virtual modules

The `pagesmithContent` Vite plugin makes each collection available as a virtual module. In this example, the plugin is configured in `vite.config.ts` with a `collections` object whose keys become the module names:

```ts
pagesmithContent({
  collections: { posts, pages },
  root: import.meta.dirname,
  configPath: './content.config.mjs',
})
```

After this configuration, you can import collections directly in any React component:

```tsx
import posts from 'virtual:content/posts'
import pages from 'virtual:content/pages'
```

These imports resolve at build time to the fully processed collection data -- no filesystem access happens at runtime.

## Entry shape

Each entry in a markdown collection has this shape:

- **`id`** -- the file path relative to the collection directory (e.g., `getting-started.md`)
- **`slug`** -- a URL-friendly version of the filename without the extension (e.g., `getting-started`)
- **`html`** -- the rendered markdown body as an HTML string
- **`headings`** -- an array of headings extracted from the document, useful for table-of-contents generation
- **`frontmatter`** -- the validated frontmatter object, typed according to your Zod schema

In a React component, you might render a post like this:

```tsx
<h1>{post.frontmatter.title}</h1>
<div dangerouslySetInnerHTML={{ __html: post.html }} />
```

## Type safety

The `pagesmithContent` plugin generates a `pagesmith-content.d.ts` file (configured via the `dts` option) that provides TypeScript declarations for all virtual modules. This means your editor knows the exact shape of each collection entry, including the frontmatter fields defined in your Zod schema.

The `dts` path in `vite.config.ts` controls where the declarations file is written -- in this example it goes to `src/pagesmith-content.d.ts`. TypeScript picks it up automatically, giving you autocomplete and type checking when you access `post.frontmatter.title` or `post.frontmatter.date`.
