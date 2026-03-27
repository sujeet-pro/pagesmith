---
title: "Schemas"
description: "Zod schema reference for frontmatter and configuration"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - reference
  - schemas
---

# Schema Reference

Pagesmith uses Zod schemas for all validation.

## Frontmatter Schemas

### BaseFrontmatterSchema

The base schema all content types extend:

```typescript
const BaseFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  publishedDate: z.coerce.date().optional(),
  lastUpdatedOn: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  layout: z.string().optional(),
})
```

### BlogFrontmatterSchema

Extends base with blog-specific fields:

```typescript
const BlogFrontmatterSchema = BaseFrontmatterSchema.extend({
  category: z.string().optional(),
  featured: z.boolean().default(false),
  coverImage: z.string().optional(),
})
```

## Collection Schema

```typescript
const CollectionDef = z.object({
  loader: z.union([z.string(), z.custom()]),
  directory: z.string(),
  schema: z.custom(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
})
```
