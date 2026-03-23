/**
 * Basic SSG builder — minimal static site generation from content.
 *
 * Enough to build a simple site without a full framework.
 */

import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { ContentLayer } from '../content-layer'
import type { ContentEntry, RenderedContent } from '../entry'

export type BuildSiteOptions = {
  /** Output directory */
  outDir: string
  /** Template function that wraps rendered content in a full HTML page */
  template: (entry: ContentEntry<any>, rendered: RenderedContent) => string
  /** Collections to include (defaults to all) */
  collections?: string[]
  /** Base URL path prefix (e.g. '/blog') */
  basePath?: string
}

/** Build a static site from a content layer. */
export async function buildSite(
  layer: ContentLayer,
  options: BuildSiteOptions,
): Promise<{ pages: number }> {
  const { outDir, template, basePath = '' } = options
  const collections = options.collections ?? layer.getCollectionNames()

  let pages = 0

  for (const name of collections) {
    const entries = await layer.getCollection(name)

    for (const entry of entries) {
      const rendered = await entry.render()
      const html = template(entry, rendered)

      // Determine output path
      const slug = entry.slug === '/' ? 'index' : entry.slug
      const outPath = join(outDir, basePath, slug, 'index.html')
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, html)
      pages++
    }
  }

  return { pages }
}
