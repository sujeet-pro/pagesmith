---
title: "Content Modeling with Zod Schemas"
description: "How to model your content with Zod schemas for type-safe frontmatter validation."
date: 2026-03-15
tags: [schemas, zod, content]
---

# Content Modeling with Zod Schemas

Every Pagesmith collection is backed by a Zod schema. This means your frontmatter is validated at build time, and your code gets full TypeScript types for free.

## Why schemas matter

Without validation, a missing `date` field or a misspelled tag silently produces broken output. With Zod schemas, you catch these errors during the build — not after deployment.

## Schema examples

```ts
const blogSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  coverImage: z.string().optional(),
})
```

## Computed fields

Use the `computed` option to derive fields from your content:

```ts
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: blogSchema,
  computed: {
    readTime: (entry) => Math.ceil(entry.rawContent.split(/\s+/).length / 200),
  },
})
```
