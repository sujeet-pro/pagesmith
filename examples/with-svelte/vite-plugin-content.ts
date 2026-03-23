/**
 * Vite plugin that creates a content layer from @pagesmith/content
 * and exposes virtual modules for collections and styles.
 *
 * Virtual modules:
 *   virtual:content/posts   — all posts, pre-rendered
 *   virtual:content/authors — all authors
 *   virtual:content/pages   — all pages, pre-rendered
 *   virtual:content/styles  — runtime CSS for rendered content
 */

import {
  BaseFrontmatterSchema,
  createContentLayer,
  defineCollection,
  defineConfig,
  z,
} from '@pagesmith/content'
import { getRuntimeCSSPath } from '@pagesmith/content/runtime'
import { createVirtualContentPlugin } from '../shared-content/vite-plugin-content'

const COLLECTIONS = ['posts', 'authors', 'pages'] as const
type CollectionName = (typeof COLLECTIONS)[number]

/**
 * Serialize a collection's entries into a JS module string.
 * Markdown collections have their content pre-rendered to HTML.
 */
async function serializeCollection(
  layer: ReturnType<typeof createContentLayer>,
  name: CollectionName,
): Promise<string> {
  const entries = await layer.getCollection(name)

  const serialized = await Promise.all(
    entries.map(async (entry) => {
      const rendered = await entry.render()
      return {
        slug: entry.slug,
        collection: entry.collection,
        data: entry.data,
        html: rendered.html,
        headings: rendered.headings,
        readTime: rendered.readTime,
      }
    }),
  )

  return `export default ${JSON.stringify(serialized, null, 2)};`
}

export default function contentPlugin() {
  const layer = createContentLayer(
    defineConfig({
      root: new URL('.', import.meta.url).pathname,
      collections: {
        posts: defineCollection({
          loader: 'markdown',
          directory: 'content/posts',
          schema: BaseFrontmatterSchema.extend({
            author: z.string().optional(),
          }),
        }),
        authors: defineCollection({
          loader: 'yaml',
          directory: 'content/authors',
          schema: z.object({
            name: z.string(),
            bio: z.string().optional(),
            avatar: z.string().optional(),
          }),
        }),
        pages: defineCollection({
          loader: 'markdown',
          directory: 'content/pages',
          schema: BaseFrontmatterSchema,
        }),
      },
    }),
  )

  return createVirtualContentPlugin({
    layer,
    serializers: {
      styles: () => {
        const cssPath = getRuntimeCSSPath()
        return `import "${cssPath}";`
      },
      posts: () => serializeCollection(layer, 'posts'),
      authors: () => serializeCollection(layer, 'authors'),
      pages: () => serializeCollection(layer, 'pages'),
    },
  })
}
