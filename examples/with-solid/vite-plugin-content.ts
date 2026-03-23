/**
 * Vite plugin that exposes @pagesmith/content collections as virtual modules.
 *
 * Virtual modules:
 *   virtual:content/posts   — array of { slug, title, description, date, tags, html }
 *   virtual:content/authors — array of author data
 *   virtual:content/pages   — array of { slug, title, html }
 *   virtual:content/styles  — CSS string for rendered content
 */

import { createContentLayer, defineConfig } from '@pagesmith/content'
import { getRuntimeCSS } from '@pagesmith/content/runtime'
import { resolve } from 'path'
import { authors, pages, posts } from '../shared-content/content.config'
import { createVirtualContentPlugin } from '../shared-content/vite-plugin-content'

const layer = createContentLayer(
  defineConfig({
    root: resolve(import.meta.dirname, '../shared-content'),
    collections: { posts, authors, pages },
  }),
)

export default function contentPlugin() {
  return createVirtualContentPlugin({
    layer,
    serializers: {
      styles: () => `export default ${JSON.stringify(getRuntimeCSS())};`,
      posts: async () => {
        const entries = await layer.getCollection('posts')
        const sorted = [...entries].sort(
          (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
        )
        const data = await Promise.all(
          sorted.map(async (entry) => {
            const { html } = await entry.render()
            return {
              slug: entry.slug,
              title: entry.data.title,
              description: entry.data.description,
              date: entry.data.date,
              tags: entry.data.tags ?? [],
              html,
            }
          }),
        )
        return `export default ${JSON.stringify(data)};`
      },
      authors: async () => {
        const entries = await layer.getCollection('authors')
        const data = entries.map((entry) => ({
          slug: entry.slug,
          ...entry.data,
        }))
        return `export default ${JSON.stringify(data)};`
      },
      pages: async () => {
        const entries = await layer.getCollection('pages')
        const data = await Promise.all(
          entries.map(async (entry) => {
            const { html } = await entry.render()
            return {
              slug: entry.slug,
              title: entry.data.title,
              html,
            }
          }),
        )
        return `export default ${JSON.stringify(data)};`
      },
    },
  })
}
