/**
 * TOML loader.
 */

import { readFileSync } from 'fs'
import { parse } from 'smol-toml'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class TomlLoader implements Loader {
  name = 'toml'
  kind = 'data' as const
  extensions = ['.toml']

  load(filePath: string): LoaderResult {
    const raw = readFileSync(filePath, 'utf-8')
    try {
      const data = parse(raw)
      return { data }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new LoaderError(message, filePath, 'TOML')
    }
  }
}
