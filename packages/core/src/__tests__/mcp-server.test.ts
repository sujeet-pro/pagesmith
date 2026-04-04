import { describe, expect, it } from 'vite-plus/test'
import { createCoreMcpServer } from '../mcp/server'

// Minimal mock ContentLayer for testing
function createMockLayer() {
  return {
    getCollectionNames: () => ['posts', 'authors'],
    getCollectionDef: (name: string) => {
      if (name === 'posts') return { loader: 'markdown', directory: 'content/posts' }
      if (name === 'authors') return { loader: 'json', directory: 'content/authors' }
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

describe('createCoreMcpServer', () => {
  it('creates a server without errors', () => {
    const layer = createMockLayer()
    const server = createCoreMcpServer({ layer: layer as any })
    expect(server).toBeDefined()
  })
})
