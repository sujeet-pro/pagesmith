/**
 * Helper to read a CLI's version string from its sibling `package.json`.
 * Used by every Pagesmith CLI's `bin.ts` to wire up `cac.version()`.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Read the `version` field from a package.json located relative to the calling
 * module. Pass `import.meta.dirname` from the caller as the `dirname` argument.
 *
 * @param dirname Directory of the calling module (typically `import.meta.dirname`).
 * @param relativePath Relative path from `dirname` to the package.json (default: `'../../package.json'`).
 */
export function readPackageVersion(dirname: string, relativePath = '../../package.json'): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(dirname, relativePath), 'utf-8')) as {
      version?: string
    }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}
