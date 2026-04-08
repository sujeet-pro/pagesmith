import { existsSync, readdirSync } from 'fs'
import { extname, join, relative } from 'path'

export { copyPublicFiles } from './copier'
export { hashAssets } from './hasher'

/** File extensions recognized as content companion assets. */
export const CONTENT_ASSET_EXTS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
])

/**
 * Directory-preserving companion asset map.
 *
 * Assets are keyed by their relative path from the content root
 * (e.g., `"articles/foo/diagram.svg"`), which prevents basename
 * collisions when multiple content entries share generic filenames.
 */
export type ContentAssetMap = {
  /** Relative path from content root → absolute source path */
  byPath: Map<string, string>
  /** Original basename → relative paths (for rewrite lookup) */
  byBasename: Map<string, string[]>
}

/**
 * Walk content directories and collect companion asset files (images, SVGs, etc.)
 * keyed by their relative path from each content root.
 */
export function collectContentAssets(contentDirs: string[]): ContentAssetMap {
  const byPath = new Map<string, string>()
  const byBasename = new Map<string, string[]>()

  for (const contentDir of contentDirs) {
    if (!existsSync(contentDir)) continue

    function walk(dir: string): void {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
          continue
        }
        const ext = extname(entry.name).toLowerCase()
        if (!CONTENT_ASSET_EXTS.has(ext)) continue

        const relPath = relative(contentDir, fullPath)

        if (byPath.has(relPath) && byPath.get(relPath) !== fullPath) {
          console.warn(
            `pagesmith duplicate companion asset path "${relPath}" across content directories; using ${fullPath}`,
          )
        }
        byPath.set(relPath, fullPath)

        const existing = byBasename.get(entry.name)
        if (existing) {
          if (!existing.includes(relPath)) existing.push(relPath)
        } else {
          byBasename.set(entry.name, [relPath])
        }
      }
    }

    walk(contentDir)
  }

  return { byPath, byBasename }
}
