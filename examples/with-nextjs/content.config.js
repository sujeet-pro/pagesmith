import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const posts = defineCollection({
  loader: 'markdown',
  directory: './content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export default defineCollections({ posts })
