/**
 * File discovery via glob patterns.
 */

import fg from 'fast-glob'
import { resolve } from 'path'

export interface DiscoverOptions {
  /** Directory to search in (absolute path) */
  directory: string
  /** Glob patterns to include */
  include: string[]
  /** Glob patterns to exclude */
  exclude?: string[]
}

/** Discover files matching glob patterns in a directory. */
export function discoverFiles(options: DiscoverOptions): string[] {
  const { directory, include, exclude = [] } = options

  return fg
    .sync(include, {
      cwd: directory,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/dev/**', ...exclude],
    })
    .map((p) => resolve(p))
}
