import { join, resolve } from 'path'
import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { createCoreMcpServer } from '../mcp/server'
import { asTextResource, getPackageVersion, resolvePackageDocPath } from '../mcp/shared'
import { createContentLayer, defineCollection, defineConfig } from '../index'

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures')

function createMockLayer() {
  return {
    getCollectionNames: () => ['posts', 'authors'],
    getCollectionDef: (name: string) => {
      if (name === 'posts')
        return {
          loader: 'markdown',
          directory: 'content/posts',
          schema: z.object({ title: z.string(), description: z.string() }),
        }
      if (name === 'authors')
        return {
          loader: 'json',
          directory: 'content/authors',
          schema: z.object({ name: z.string() }),
        }
      return undefined
    },
    getCollection: async () => [],
    getEntry: async () => undefined,
    convert: async (md: string) => ({ html: `<p>${md}</p>`, toc: [], frontmatter: {} }),
    invalidate: async () => {},
    invalidateCollection: async () => {},
    invalidateAll: () => {},
    invalidateWhere: async () => 0,
    validate: async () => [],
    getCollections: () => ({}),
    watch: () => ({ close: () => {} }),
    getCacheStats: () => ({ collections: 0, entries: {}, totalEntries: 0 }),
  }
}

function createRealLayer() {
  const config = defineConfig({
    root: FIXTURES_DIR,
    collections: {
      posts: defineCollection({
        loader: 'markdown',
        directory: 'content',
        schema: z.object({
          title: z.string(),
          description: z.string(),
          tags: z.array(z.string()).default([]),
          draft: z.boolean().optional(),
        }),
        disableBuiltinValidators: true,
      }),
    },
  })
  return createContentLayer(config)
}

describe('createCoreMcpServer', () => {
  it('creates a server without errors', () => {
    const layer = createMockLayer()
    const server = createCoreMcpServer({ layer: layer as any })
    expect(server).toBeDefined()
  })

  it('creates a server with a real content layer', () => {
    const layer = createRealLayer()
    const server = createCoreMcpServer({ layer, rootDir: FIXTURES_DIR })
    expect(server).toBeDefined()
  })

  it('uses custom rootDir when provided', () => {
    const layer = createMockLayer()
    const server = createCoreMcpServer({ layer: layer as any, rootDir: '/custom/root' })
    expect(server).toBeDefined()
  })
})

describe('MCP shared utilities', () => {
  describe('getPackageVersion', () => {
    it('reads version from package.json relative to module dir', () => {
      const moduleDir = resolve(import.meta.dirname, '..', 'mcp')
      const version = getPackageVersion(moduleDir)
      expect(typeof version).toBe('string')
      expect(version).toMatch(/^\d+\.\d+\.\d+/)
    })
  })

  describe('resolvePackageDocPath', () => {
    it('resolves doc path relative to package root', () => {
      const moduleDir = resolve(import.meta.dirname, '..', 'mcp')
      const docPath = resolvePackageDocPath(moduleDir, 'ai-guidelines/usage.md')
      expect(docPath).toContain('ai-guidelines/usage.md')
    })
  })

  describe('asTextResource', () => {
    it('loads file as MCP text resource', () => {
      const fixturePath = join(FIXTURES_DIR, 'content', 'hello.md')
      const result = asTextResource('pagesmith://test', fixturePath)

      expect(result.contents).toHaveLength(1)
      expect(result.contents[0].uri).toBe('pagesmith://test')
      expect(result.contents[0].mimeType).toBe('text/markdown')
      expect(result.contents[0].text).toContain('Hello World')
    })

    it('throws for missing file', () => {
      expect(() => asTextResource('pagesmith://test', '/nonexistent/file.md')).toThrow(
        'Resource file not found',
      )
    })
  })
})
