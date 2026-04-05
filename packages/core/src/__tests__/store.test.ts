import { join } from 'path'
import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { ContentStore } from '../store'
import type { ContentLayerConfig } from '../schemas/content-config'

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures')

function makeConfig(overrides: Partial<ContentLayerConfig> = {}): ContentLayerConfig {
  return {
    root: FIXTURES_DIR,
    collections: {
      posts: {
        loader: 'markdown',
        directory: 'content',
        schema: z.object({
          title: z.string(),
          description: z.string(),
          tags: z.array(z.string()).default([]),
          draft: z.boolean().optional(),
        }),
        disableBuiltinValidators: true,
      },
    },
    ...overrides,
  }
}

describe('ContentStore', () => {
  describe('loadCollection', () => {
    it('loads entries from a directory', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      const entries = await store.loadCollection('posts', def)

      expect(entries.length).toBe(3)
      const slugs = entries.map((e) => e.slug).sort()
      expect(slugs).toEqual(['draft', 'hello', 'second'])
    })

    it('returns cached entries on subsequent calls', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      const first = await store.loadCollection('posts', def)
      const second = await store.loadCollection('posts', def)

      expect(first).toEqual(second)
    })

    it('validates entries against the schema', async () => {
      const config = makeConfig({
        collections: {
          strict: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              requiredField: z.string(),
            }),
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('strict', config.collections.strict)

      expect(entries.length).toBe(3)
      const issues = store.getIssues('strict')
      expect(issues.size).toBeGreaterThan(0)
    })
  })

  describe('computed fields', () => {
    it('applies computed fields to entry data', async () => {
      const config = makeConfig({
        collections: {
          posts: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              tags: z.array(z.string()).default([]),
              draft: z.boolean().optional(),
              slug_upper: z.string().optional(),
            }),
            computed: {
              slug_upper: (entry: { slug: string }) => entry.slug.toUpperCase(),
            },
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('posts', config.collections.posts)

      const hello = entries.find((e) => e.slug === 'hello')
      expect(hello).toBeDefined()
      expect(hello!.data.slug_upper).toBe('HELLO')
    })
  })

  describe('transform', () => {
    it('applies transform to raw entries before validation', async () => {
      const config = makeConfig({
        collections: {
          posts: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              tags: z.array(z.string()).default([]),
              draft: z.boolean().optional(),
              transformed: z.boolean().default(false),
            }),
            transform: (raw) => {
              raw.data.transformed = true
              return raw
            },
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('posts', config.collections.posts)

      for (const entry of entries) {
        expect(entry.data.transformed).toBe(true)
      }
    })
  })

  describe('filter', () => {
    it('excludes entries that fail the filter', async () => {
      const config = makeConfig({
        collections: {
          posts: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              tags: z.array(z.string()).default([]),
              draft: z.boolean().optional(),
            }),
            filter: (entry) => entry.data.draft !== true,
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('posts', config.collections.posts)

      expect(entries.length).toBe(2)
      expect(entries.find((e) => e.slug === 'draft')).toBeUndefined()
    })
  })

  describe('custom validation', () => {
    it('collects custom validation errors', async () => {
      const config = makeConfig({
        collections: {
          posts: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              tags: z.array(z.string()).default([]),
              draft: z.boolean().optional(),
            }),
            validate: (entry) => {
              if (entry.data.draft === true) return 'Draft posts are not allowed'
              return undefined
            },
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      await store.loadCollection('posts', config.collections.posts)

      const issues = store.getIssues('posts')
      const draftIssues = issues.get('draft')
      expect(draftIssues).toBeDefined()
      expect(draftIssues!.some((i) => i.message === 'Draft posts are not allowed')).toBe(true)
    })
  })

  describe('custom slugify', () => {
    it('uses custom slugify function when provided', async () => {
      const config = makeConfig({
        collections: {
          posts: {
            loader: 'markdown',
            directory: 'content',
            schema: z.object({
              title: z.string(),
              description: z.string(),
              tags: z.array(z.string()).default([]),
              draft: z.boolean().optional(),
            }),
            slugify: (_filePath, _dir) => 'custom-slug',
            disableBuiltinValidators: true,
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('posts', config.collections.posts)

      // All entries will have the same slug, so only the last one survives in the map
      expect(entries.length).toBe(1)
      expect(entries[0].slug).toBe('custom-slug')
    })
  })

  describe('getEntry', () => {
    it('returns a cached entry by slug', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      await store.loadCollection('posts', def)

      const entry = store.getEntry('posts', 'hello')
      expect(entry).toBeDefined()
      expect(entry!.slug).toBe('hello')
    })

    it('returns undefined for non-existent slug', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      await store.loadCollection('posts', def)

      expect(store.getEntry('posts', 'nonexistent')).toBeUndefined()
    })

    it('returns undefined for non-loaded collection', () => {
      const store = new ContentStore(makeConfig())
      expect(store.getEntry('posts', 'hello')).toBeUndefined()
    })
  })

  describe('isCollectionLoaded', () => {
    it('returns false before loading', () => {
      const store = new ContentStore(makeConfig())
      expect(store.isCollectionLoaded('posts')).toBe(false)
    })

    it('returns true after loading', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)
      expect(store.isCollectionLoaded('posts')).toBe(true)
    })
  })

  describe('invalidate', () => {
    it('reloads a single entry by slug', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      await store.loadCollection('posts', def)

      const before = store.getEntry('posts', 'hello')
      expect(before).toBeDefined()

      await store.invalidate('posts', 'hello')

      const after = store.getEntry('posts', 'hello')
      expect(after).toBeDefined()
      expect(after!.data.title).toBe('Hello World')
    })

    it('silently ignores unknown collection', async () => {
      const store = new ContentStore(makeConfig())
      await store.invalidate('nonexistent', 'hello')
    })

    it('silently ignores unknown slug', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)
      await store.invalidate('posts', 'nonexistent')
    })
  })

  describe('invalidateCollection', () => {
    it('clears the collection cache', async () => {
      const store = new ContentStore(makeConfig())
      const def = makeConfig().collections.posts
      await store.loadCollection('posts', def)

      expect(store.isCollectionLoaded('posts')).toBe(true)
      await store.invalidateCollection('posts')
      expect(store.isCollectionLoaded('posts')).toBe(false)
    })
  })

  describe('invalidateAll', () => {
    it('clears all caches', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)

      store.invalidateAll()
      expect(store.isCollectionLoaded('posts')).toBe(false)
      expect(store.getCacheStats().totalEntries).toBe(0)
    })
  })

  describe('invalidateWhere', () => {
    it('reloads entries matching the predicate', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)

      const count = await store.invalidateWhere('posts', (entry) => entry.slug === 'hello')
      expect(count).toBe(1)

      const hello = store.getEntry('posts', 'hello')
      expect(hello).toBeDefined()
    })

    it('returns 0 for non-loaded collection', async () => {
      const store = new ContentStore(makeConfig())
      const count = await store.invalidateWhere('posts', () => true)
      expect(count).toBe(0)
    })

    it('returns 0 when no entries match', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)

      const count = await store.invalidateWhere('posts', () => false)
      expect(count).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    it('returns zero stats before loading', () => {
      const store = new ContentStore(makeConfig())
      const stats = store.getCacheStats()
      expect(stats.collections).toBe(0)
      expect(stats.totalEntries).toBe(0)
      expect(stats.entries).toEqual({})
    })

    it('returns accurate stats after loading', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)

      const stats = store.getCacheStats()
      expect(stats.collections).toBe(1)
      expect(stats.totalEntries).toBe(3)
      expect(stats.entries.posts).toBe(3)
    })
  })

  describe('getIssues', () => {
    it('returns empty map for collection with no issues', async () => {
      const store = new ContentStore(makeConfig())
      await store.loadCollection('posts', makeConfig().collections.posts)
      const issues = store.getIssues('posts')
      expect(issues.size).toBe(0)
    })

    it('returns empty map for unloaded collection', () => {
      const store = new ContentStore(makeConfig())
      const issues = store.getIssues('posts')
      expect(issues.size).toBe(0)
    })
  })

  describe('strict mode', () => {
    it('throws on loader failures in strict mode', async () => {
      const config = makeConfig({
        strict: true,
        collections: {
          bad: {
            loader: 'json',
            directory: 'content',
            include: ['**/*.md'],
            schema: z.object({ title: z.string() }),
          },
        },
      })
      const store = new ContentStore(config)

      await expect(store.loadCollection('bad', config.collections.bad)).rejects.toThrow()
    })

    it('warns instead of throwing in non-strict mode', async () => {
      const config = makeConfig({
        strict: false,
        collections: {
          bad: {
            loader: 'json',
            directory: 'content',
            include: ['**/*.md'],
            schema: z.object({ title: z.string() }),
          },
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('bad', config.collections.bad)

      expect(entries.length).toBe(3)
      const issues = store.getIssues('bad')
      expect(issues.size).toBeGreaterThan(0)
    })
  })

  describe('markdown plugin config', () => {
    it('merges user markdown plugins with config', async () => {
      const remarkPlugin = () => (tree: any) => tree
      const config = makeConfig({
        markdown: {
          remarkPlugins: [remarkPlugin],
        },
      })
      const store = new ContentStore(config)
      const entries = await store.loadCollection('posts', config.collections.posts)

      expect(entries.length).toBe(3)
    })
  })
})
