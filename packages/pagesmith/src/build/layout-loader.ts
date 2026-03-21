/**
 * Layout loader.
 *
 * Dynamically imports TSX layout files and caches them.
 * Supports multi-directory resolution: tries each directory in order,
 * allowing user layouts to override framework defaults.
 *
 * Resolves the appropriate layout name for a page based on
 * its slug, frontmatter, and page type meta configuration.
 */

import { existsSync, } from 'fs'
import { join, } from 'path'
import type { PageTypeMeta, SiteConfig, } from '../../schemas'
import type { BaseLayoutProps, } from '../../schemas/layout-props'
type LayoutProps = BaseLayoutProps & Record<string, any>

const layoutCache = new Map<string, (props: LayoutProps,) => any>()

/**
 * Load a layout by name (cached).
 *
 * When `layoutsDir` is an array, tries each directory in order.
 * This enables user layouts to override framework theme defaults.
 */
export async function getLayout(
  name: string,
  layoutsDir: string | string[],
): Promise<(props: LayoutProps,) => any> {
  if (layoutCache.has(name,)) return layoutCache.get(name,)!

  const dirs = Array.isArray(layoutsDir,) ? layoutsDir : [layoutsDir,]
  for (const dir of dirs) {
    const path = join(dir, `${name}.tsx`,)
    if (existsSync(path,)) {
      const mod = await import(path,)
      layoutCache.set(name, mod.default,)
      return mod.default
    }
  }

  // Fallback: try first dir (will throw a useful error on import failure)
  const path = join(dirs[0], `${name}.tsx`,)
  const mod = await import(path,)
  layoutCache.set(name, mod.default,)
  return mod.default
}

/** Clear the layout cache (useful for dev/watch mode). */
export function clearLayoutCache(): void {
  layoutCache.clear()
}

/** Resolve the layout name for a page based on its slug and page type meta. */
export function resolveLayout(
  slug: string,
  frontmatter: Record<string, any>,
  config: SiteConfig,
  pageTypeMetas: Map<string, PageTypeMeta>,
): string {
  if (frontmatter.layout) return frontmatter.layout

  // Determine layout from page type meta
  const parts = slug.split('/',).filter(Boolean,)
  if (parts.length >= 1) {
    const type = parts[0]
    const meta = pageTypeMetas.get(type,)
    if (meta) {
      // Listing page (e.g., /articles, /blogs, /projects)
      if (parts.length === 1) return meta.layout
      // Item page (e.g., /articles/crp-dom-construction)
      return meta.itemLayout
    }
  }

  return config.defaultLayout
}
