/**
 * Markdown loader.
 *
 * Uses gray-matter to extract YAML frontmatter and body content.
 * Rendering is NOT done here — it's deferred to ContentEntry.render().
 */

import { readFileSync } from 'fs'
import matter from 'gray-matter'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class MarkdownLoader implements Loader {
  name = 'markdown'
  kind = 'markdown' as const
  extensions = ['.md']

  load(filePath: string): LoaderResult {
    const raw = readFileSync(filePath, 'utf-8')
    try {
      const { data, content } = matter(raw)
      return { data, content }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new LoaderError(message, filePath, 'Markdown')
    }
  }
}
