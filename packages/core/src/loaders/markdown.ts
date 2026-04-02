/**
 * Markdown loader.
 *
 * Uses gray-matter to extract YAML frontmatter and body content.
 * Rendering is NOT done here — it's deferred to ContentEntry.render().
 */

import { readFile } from 'fs/promises'
import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class MarkdownLoader implements Loader {
  name = 'markdown'
  kind = 'markdown' as const
  extensions = ['.md']

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, 'utf-8')
    try {
      const { data, content } = matter(raw, { engines: { yaml: parseYaml } })
      return { data, content }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new LoaderError(message, filePath, 'Markdown')
    }
  }
}
