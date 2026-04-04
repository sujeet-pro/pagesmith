import { join } from 'path'
import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { createContentLayer } from '../content-layer'
import { defineCollection, defineConfig } from '../config'

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures')

const posts = defineCollection({
  loader: 'markdown',
  directory: join(FIXTURES_DIR, 'content'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional(),
  }),
  disableBuiltinValidators: true,
})

function makeLayer() {
  const config = defineConfig({
    collections: { posts },
    root: FIXTURES_DIR,
  })
  return createContentLayer(config)
}

describe('createContentLayer', () => {
  it('creates a valid layer with expected methods', () => {
    const layer = makeLayer()
    expect(typeof layer.getCollection).toBe('function')
    expect(typeof layer.getEntry).toBe('function')
    expect(typeof layer.invalidateCollection).toBe('function')
    expect(typeof layer.invalidateAll).toBe('function')
    expect(typeof layer.validate).toBe('function')
    expect(typeof layer.getCollectionNames).toBe('function')
    expect(typeof layer.getCollectionDef).toBe('function')
    expect(typeof layer.convert).toBe('function')
  })
})

describe('getCollectionNames', () => {
  it('returns configured collection names', () => {
    const layer = makeLayer()
    expect(layer.getCollectionNames()).toEqual(['posts'])
  })
})

describe('getCollectionDef', () => {
  it('returns the collection definition for a known name', () => {
    const layer = makeLayer()
    const def = layer.getCollectionDef('posts')
    expect(def).toBeDefined()
    expect(def!.loader).toBe('markdown')
  })

  it('returns undefined for an unknown collection', () => {
    const layer = makeLayer()
    expect(layer.getCollectionDef('nonexistent')).toBeUndefined()
  })
})

describe('getCollection', () => {
  it('loads entries from a test content directory', async () => {
    const layer = makeLayer()
    const entries = await layer.getCollection('posts')
    expect(entries.length).toBe(3)

    const slugs = entries.map((e) => e.slug).sort()
    expect(slugs).toEqual(['draft', 'hello', 'second'])
  })

  it('entries have correct data from frontmatter', async () => {
    const layer = makeLayer()
    const entries = await layer.getCollection('posts')
    const hello = entries.find((e) => e.slug === 'hello')
    expect(hello).toBeDefined()
    expect(hello!.data.title).toBe('Hello World')
    expect(hello!.data.description).toBe('A test post')
    expect(hello!.data.tags).toEqual(['test'])
  })

  it('entries have rawContent', async () => {
    const layer = makeLayer()
    const entries = await layer.getCollection('posts')
    const hello = entries.find((e) => e.slug === 'hello')
    expect(hello!.rawContent).toContain('# Hello World')
  })

  it('throws for a non-existent collection', async () => {
    const layer = makeLayer()
    await expect(layer.getCollection('nonexistent')).rejects.toThrow(
      /Collection "nonexistent" not found/,
    )
  })
})

describe('getEntry', () => {
  it('returns correct entry by slug', async () => {
    const layer = makeLayer()
    const entry = await layer.getEntry('posts', 'second')
    expect(entry).toBeDefined()
    expect(entry!.data.title).toBe('Second Post')
    expect(entry!.data.tags).toEqual(['test', 'example'])
  })

  it('returns undefined for non-existent slug', async () => {
    const layer = makeLayer()
    const entry = await layer.getEntry('posts', 'does-not-exist')
    expect(entry).toBeUndefined()
  })
})

describe('invalidateCollection', () => {
  it('forces reload on next access', async () => {
    const layer = makeLayer()
    // Load once
    const first = await layer.getCollection('posts')
    expect(first.length).toBe(3)

    // Invalidate
    await layer.invalidateCollection('posts')

    // Load again — should re-discover files
    const second = await layer.getCollection('posts')
    expect(second.length).toBe(3)
  })
})

describe('invalidateAll', () => {
  it('forces reload on next access for all collections', async () => {
    const layer = makeLayer()
    await layer.getCollection('posts')

    layer.invalidateAll()

    const entries = await layer.getCollection('posts')
    expect(entries.length).toBe(3)
  })
})

describe('validate', () => {
  it('returns validation results for a collection', async () => {
    const layer = makeLayer()
    const results = await layer.validate('posts')
    expect(results.length).toBe(1)
    expect(results[0].collection).toBe('posts')
  })

  it('returns validation results for all collections when no name given', async () => {
    const layer = makeLayer()
    const results = await layer.validate()
    expect(results.length).toBe(1)
    expect(results[0].collection).toBe('posts')
  })
})

describe('convert', () => {
  it('converts raw markdown to HTML', async () => {
    const layer = makeLayer()
    const result = await layer.convert('# Hello\n\nWorld')
    expect(result.html).toContain('Hello')
    expect(result.html).toContain('World')
  })
})
