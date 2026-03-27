/**
 * Shared content collection definitions.
 *
 * Imported by each example app, with directory paths
 * overridden relative to the shared-content location.
 */

import { defineCollection, defineCollections, type RawEntry, z } from '@pagesmith/core'

const content = defineCollections({
  posts: defineCollection({
    loader: 'markdown',
    directory: './posts',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      author: z.string().optional(),
      draft: z.boolean().default(false),
    }),
    computed: {
      readTime: (entry: RawEntry) => Math.ceil((entry.content?.split(/\s+/).length ?? 0) / 200),
    },
    filter: (entry) => !entry.data.draft || process.env.NODE_ENV !== 'production',
  }),

  authors: defineCollection({
    loader: 'json',
    directory: './authors',
    schema: z.object({
      name: z.string(),
      bio: z.string(),
      avatar: z.string().optional(),
    }),
  }),

  pages: defineCollection({
    loader: 'markdown',
    directory: './pages',
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),

  configYaml: defineCollection({
    loader: 'yaml',
    directory: './config',
    include: ['*.yaml'],
    schema: z.object({
      site: z
        .object({
          title: z.string(),
          description: z.string(),
          baseUrl: z.string(),
          language: z.string(),
          author: z.string().optional(),
        })
        .optional(),
      build: z
        .object({
          outDir: z.string(),
          parallel: z.boolean(),
          validate: z.boolean(),
          cleanBeforeBuild: z.boolean().optional(),
        })
        .optional(),
      dev: z
        .object({
          port: z.number(),
          open: z.boolean().optional(),
          watchDebounceMs: z.number().optional(),
        })
        .optional(),
      markdown: z.record(z.string(), z.any()).optional(),
      assets: z.record(z.string(), z.any()).optional(),
    }),
  }),

  configToml: defineCollection({
    loader: 'toml',
    directory: './config',
    include: ['*.toml'],
    schema: z.object({
      search: z
        .object({
          enabled: z.boolean(),
          provider: z.string(),
          indexOnBuild: z.boolean().optional(),
        })
        .optional(),
      analytics: z
        .object({
          enabled: z.boolean(),
          provider: z.string().optional(),
          endpoint: z.string().optional(),
        })
        .optional(),
      rss: z
        .object({
          enabled: z.boolean(),
          feedPath: z.string().optional(),
          maxItems: z.number().optional(),
        })
        .optional(),
      sitemap: z
        .object({
          enabled: z.boolean(),
          changeFreq: z.string().optional(),
          priority: z.number().optional(),
        })
        .optional(),
      diagrams: z
        .object({
          mermaid: z.boolean().optional(),
          excalidraw: z.boolean().optional(),
          renderOnBuild: z.boolean().optional(),
          watchInDev: z.boolean().optional(),
        })
        .optional(),
      darkMode: z
        .object({
          enabled: z.boolean(),
          defaultTheme: z.string().optional(),
          storageKey: z.string().optional(),
        })
        .optional(),
      comments: z.record(z.string(), z.any()).optional(),
    }),
  }),

  configJson5: defineCollection({
    loader: 'json5',
    directory: './config',
    include: ['*.json5'],
    schema: z.object({
      colors: z.record(z.string(), z.string()).optional(),
      fonts: z.record(z.string(), z.string()).optional(),
      layout: z.record(z.string(), z.string()).optional(),
      code: z
        .object({
          themes: z.record(z.string(), z.string()).optional(),
          showLineNumbers: z.boolean().optional(),
          copyButton: z.boolean().optional(),
          wrapLongLines: z.boolean().optional(),
        })
        .optional(),
      components: z.record(z.string(), z.any()).optional(),
    }),
  }),
})

export default content

export const { authors, configJson5, configToml, configYaml, pages, posts } = content
