/**
 * YAML loader.
 */

import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

export class YamlLoader implements Loader {
  name = 'yaml'
  extensions = ['.yaml', '.yml']

  load(filePath: string): LoaderResult {
    const raw = readFileSync(filePath, 'utf-8')
    try {
      const data = parse(raw) ?? {}
      return { data }
    } catch (err: any) {
      throw new LoaderError(err.message, filePath, 'YAML', err.linePos?.[0]?.line)
    }
  }
}
