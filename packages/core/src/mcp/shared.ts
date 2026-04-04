/**
 * Shared MCP server utilities.
 *
 * Common helpers used by both @pagesmith/core and @pagesmith/docs MCP servers.
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

/** Read the package version from a package.json relative to the calling module. */
export function getPackageVersion(moduleDir: string): string {
  const pkgPath = resolve(moduleDir, '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
  return pkg.version ?? '0.0.0'
}

/** Resolve a doc file path relative to the package root. */
export function resolvePackageDocPath(moduleDir: string, relativePath: string): string {
  return resolve(moduleDir, '..', '..', relativePath)
}

/** Load a file as an MCP text resource response. Throws if the file doesn't exist. */
export function asTextResource(uri: string, path: string) {
  if (!existsSync(path)) {
    throw new Error(`Resource file not found: ${path}`)
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: readFileSync(path, 'utf-8'),
      },
    ],
  }
}
