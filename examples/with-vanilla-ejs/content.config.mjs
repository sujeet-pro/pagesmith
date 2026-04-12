// Declarative content boundaries: each collection maps a directory to a Zod
// schema so frontmatter is validated before `entry-server` calls `render()`.
// This file stays `.mjs` so Node/Vite can load it without a separate TS emit.

import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const guide = defineCollection({
  loader: 'markdown',
  directory: './content/guide',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
})

export const pages = defineCollection({
  loader: 'markdown',
  directory: './content/pages',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export default defineCollections({ guide, pages })
