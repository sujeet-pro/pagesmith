import { existsSync, readdirSync } from 'fs'
import { extname, join } from 'path'

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
 * Walk content directories and collect companion asset files (images, SVGs, etc.)
 * keyed by basename. Warns on duplicate basenames across directories.
 */
export function collectContentAssets(contentDirs: string[]): Map<string, string> {
  const assets = new Map<string, string>()

  function walk(dir: string): void {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      const ext = extname(entry.name).toLowerCase()
      if (!CONTENT_ASSET_EXTS.has(ext)) continue
      if (assets.has(entry.name) && assets.get(entry.name) !== fullPath) {
        console.warn(
          `pagesmith duplicate companion asset basename "${entry.name}" detected; using ${fullPath}`,
        )
      }
      assets.set(entry.name, fullPath)
    }
  }

  for (const dir of contentDirs) {
    walk(dir)
  }
  return assets
}
