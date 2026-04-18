import { defineCollection, defineCollections, z } from "@pagesmith/site";

export const guide = defineCollection({
  loader: "markdown",
  directory: "./content/guide",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

export const pages = defineCollection({
  loader: "markdown",
  directory: "./content/pages",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export default defineCollections({ guide, pages });
