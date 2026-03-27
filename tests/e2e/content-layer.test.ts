import { describe, expect, it } from 'vite-plus/test'
import { resolve } from 'path'
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'

const FIXTURES = resolve(import.meta.dirname, '../../examples/shared-content')

describe('content layer', () => {
  it('loads a markdown collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
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
        }),
      },
    })
    const layer = createContentLayer(config)
    const posts = await layer.getCollection('posts')
    expect(posts.length).toBeGreaterThanOrEqual(3)

    const hello = posts.find((p) => p.slug === 'hello-world')
    expect(hello).toBeDefined()
    expect(hello!.data.title).toBe('Hello World')
    expect(hello!.data.tags).toContain('intro')
  })

  it('renders markdown entries to HTML', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
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
        }),
      },
    })
    const layer = createContentLayer(config)
    const posts = await layer.getCollection('posts')
    const hello = posts.find((p) => p.slug === 'hello-world')!

    const rendered = await hello.render()
    expect(rendered.html).toContain('<h1')
    expect(rendered.html).toContain('Hello World')
    expect(rendered.headings.length).toBeGreaterThan(0)
    expect(rendered.readTime).toBeGreaterThan(0)
  })

  it('loads a JSON collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
        authors: defineCollection({
          loader: 'json',
          directory: './authors',
          schema: z.object({
            name: z.string(),
            bio: z.string(),
            avatar: z.string().optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const authors = await layer.getCollection('authors')
    expect(authors.length).toBe(2)

    const john = authors.find((a) => a.slug === 'john-doe')
    expect(john).toBeDefined()
    expect(john!.data.name).toBe('John Doe')
  })

  it('loads a YAML collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
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
            build: z.record(z.string(), z.any()).optional(),
            dev: z.record(z.string(), z.any()).optional(),
            markdown: z.record(z.string(), z.any()).optional(),
            assets: z.record(z.string(), z.any()).optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const entries = await layer.getCollection('configYaml')
    expect(entries.length).toBe(1)
    expect(entries[0]!.data.site?.title).toBe('Pagesmith Documentation')
  })

  it('loads a TOML collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
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
            analytics: z.record(z.string(), z.any()).optional(),
            rss: z.record(z.string(), z.any()).optional(),
            sitemap: z.record(z.string(), z.any()).optional(),
            diagrams: z.record(z.string(), z.any()).optional(),
            darkMode: z.record(z.string(), z.any()).optional(),
            comments: z.record(z.string(), z.any()).optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const entries = await layer.getCollection('configToml')
    expect(entries.length).toBe(1)
    expect(entries[0]!.data.search?.provider).toBe('pagefind')
  })

  it('loads a JSON5 collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
        configJson5: defineCollection({
          loader: 'json5',
          directory: './config',
          include: ['*.json5'],
          schema: z.object({
            colors: z.record(z.string(), z.string()).optional(),
            fonts: z.record(z.string(), z.string()).optional(),
            layout: z.record(z.string(), z.string()).optional(),
            code: z.record(z.string(), z.any()).optional(),
            components: z.record(z.string(), z.any()).optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const entries = await layer.getCollection('configJson5')
    expect(entries.length).toBe(1)
    expect(entries[0]!.data.colors?.primary).toBe('#3b82f6')
  })

  it('gets a single entry by slug', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
        authors: defineCollection({
          loader: 'json',
          directory: './authors',
          schema: z.object({
            name: z.string(),
            bio: z.string(),
            avatar: z.string().optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const jane = await layer.getEntry('authors', 'jane-doe')
    expect(jane).toBeDefined()
    expect(jane!.data.name).toBe('Jane Doe')
  })

  it('returns undefined for nonexistent entry', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
        authors: defineCollection({
          loader: 'json',
          directory: './authors',
          schema: z.object({
            name: z.string(),
            bio: z.string(),
            avatar: z.string().optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const nope = await layer.getEntry('authors', 'nonexistent')
    expect(nope).toBeUndefined()
  })

  it('throws for nonexistent collection', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {},
    })
    const layer = createContentLayer(config)
    await expect(layer.getCollection('nope')).rejects.toThrow('not found')
  })

  it('invalidates cache and reloads', async () => {
    const config = defineConfig({
      root: FIXTURES,
      collections: {
        authors: defineCollection({
          loader: 'json',
          directory: './authors',
          schema: z.object({
            name: z.string(),
            bio: z.string(),
            avatar: z.string().optional(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)

    const first = await layer.getCollection('authors')
    expect(first.length).toBe(2)

    layer.invalidateAll()
    const second = await layer.getCollection('authors')
    expect(second.length).toBe(2)
  })
})
