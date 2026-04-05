/**
 * JSONC loader — JSON with Comments.
 *
 * Strips single-line (//) and multi-line comments before parsing.
 * Delegates to JSON.parse after stripping (no JSON5 superset features).
 */

import { readFile } from 'fs/promises'
import { LoaderError } from './errors'
import type { Loader, LoaderResult } from './types'

/** Strip // and block comments, preserving strings. */
function stripComments(raw: string): string {
  let result = ''
  let i = 0
  const len = raw.length

  while (i < len) {
    // String literal — copy verbatim to preserve contents
    if (raw[i] === '"') {
      let end = i + 1
      while (end < len && raw[end] !== '"') {
        if (raw[end] === '\\') end++ // skip escaped char
        end++
      }
      result += raw.slice(i, end + 1)
      i = end + 1
      continue
    }

    // Single-line comment
    if (raw[i] === '/' && raw[i + 1] === '/') {
      i += 2
      while (i < len && raw[i] !== '\n') i++
      continue
    }

    // Block comment
    if (raw[i] === '/' && raw[i + 1] === '*') {
      i += 2
      while (i < len && !(raw[i] === '*' && raw[i + 1] === '/')) i++
      i += 2 // skip closing */
      continue
    }

    result += raw[i]
    i++
  }

  return result
}

export class JsoncLoader implements Loader {
  name = 'jsonc'
  kind = 'data' as const
  extensions = ['.jsonc']

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, 'utf-8')
    try {
      const stripped = stripComments(raw)
      const withoutTrailingCommas = stripped.replace(/,\s*([}\]])/g, '$1')
      const data = JSON.parse(withoutTrailingCommas)
      return { data }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new LoaderError(message, filePath, 'JSONC')
    }
  }
}
