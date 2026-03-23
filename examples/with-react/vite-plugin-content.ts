/**
 * Vite plugin for @pagesmith/content.
 *
 * Loads shared-content collections at build start and exposes them
 * as virtual modules: virtual:content/posts, virtual:content/authors,
 * virtual:content/pages, and virtual:content/styles.
 */

import { createContentLayer, defineConfig } from '@pagesmith/content'
import { getRuntimeCSS } from '@pagesmith/content/runtime'
import { resolve } from 'path'
import { authors, pages, posts } from '../shared-content/content.config'
import { createVirtualContentPlugin } from '../shared-content/vite-plugin-content'

export function contentPlugin() {
  const layer = createContentLayer(
    defineConfig({
      root: resolve(import.meta.dirname, '../shared-content'),
      collections: { posts, authors, pages },
    }),
  )

  return createVirtualContentPlugin({
    layer,
    serializers: {
      posts: async () => {
        const entries = await layer.getCollection('posts')
        const rendered = await Promise.all(
          entries.map(async (entry) => {
            const { html, headings, readTime } = await entry.render()
            return {
              slug: entry.slug,
              data: entry.data,
              html,
              headings,
              readTime,
            }
          }),
        )

        return `export default ${JSON.stringify(rendered)};`
      },
      authors: async () => {
        const entries = await layer.getCollection('authors')
        const data = entries.map((entry) => ({
          slug: entry.slug,
          data: entry.data,
        }))
        return `export default ${JSON.stringify(data)};`
      },
      pages: async () => {
        const entries = await layer.getCollection('pages')
        const rendered = await Promise.all(
          entries.map(async (entry) => {
            const { html, headings } = await entry.render()
            return {
              slug: entry.slug,
              data: entry.data,
              html,
              headings,
            }
          }),
        )

        return `export default ${JSON.stringify(rendered)};`
      },
      styles: () => `export default ${JSON.stringify(getRuntimeCSS())};`,
    },
  })
}
