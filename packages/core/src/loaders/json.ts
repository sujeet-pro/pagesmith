/**
 * JSON / JSON5 / JSONC loader.
 *
 * Detects format from file extension and parses accordingly.
 */

import { readFile } from 'fs/promises'
import JSON5 from 'json5'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class JsonLoader implements Loader {
  name = 'json'
  kind = 'data' as const
  extensions = ['.json', '.json5']

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, 'utf-8')
    const isJson = filePath.endsWith('.json')

    try {
      const data = isJson ? JSON.parse(raw) : JSON5.parse(raw)
      return { data }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new LoaderError(message, filePath, isJson ? 'JSON' : 'JSON5')
    }
  }
}
