/**
 * YAML loader.
 */

import { readFile } from 'fs/promises'
import { parse } from 'yaml'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class YamlLoader implements Loader {
  name = 'yaml'
  kind = 'data' as const
  extensions = ['.yaml', '.yml']

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, 'utf-8')
    try {
      const data = parse(raw) ?? {}
      return { data }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const line =
        err != null && typeof err === 'object' && 'linePos' in err
          ? (err as any).linePos?.[0]?.line
          : undefined
      throw new LoaderError(message, filePath, 'YAML', line)
    }
  }
}
