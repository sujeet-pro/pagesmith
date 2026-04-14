import { existsSync, readdirSync } from 'fs'
import { extname, join, relative } from 'path'

export { copyPublicFiles } from './copier'
export { hashAssets } from './hasher'
export {
  CONVERTIBLE_IMAGE_EXTS,
  GENERATED_IMAGE_FORMATS,
  emitGeneratedImageVariants,
  getGeneratedImageVariantPath,
  getLocalImageDimensions,
  isConvertibleImagePath,
  renderGeneratedImageVariant,
  resolveGeneratedImageSourceAssetPath,
  resolveGeneratedImageSourcePath,
  type GeneratedImageFormat,
  type LocalImageDimensions,
} from './images'

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

function normalizeAssetPathKey(path: string): string {
  return path.replace(/\\/g, '/')
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
      const entries = readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
        left.name.localeCompare(right.name),
      )

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
          continue
        }
        const ext = extname(entry.name).toLowerCase()
        if (!CONTENT_ASSET_EXTS.has(ext)) continue

        const relPath = normalizeAssetPathKey(relative(contentDir, fullPath))

        if (byPath.has(relPath) && byPath.get(relPath) !== fullPath) {
          throw new Error(
            `pagesmith duplicate companion asset path "${relPath}" across content directories: ${byPath.get(relPath)} and ${fullPath}`,
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

  for (const candidates of byBasename.values()) {
    candidates.sort((left, right) => left.localeCompare(right))
  }

  return { byPath, byBasename }
}
