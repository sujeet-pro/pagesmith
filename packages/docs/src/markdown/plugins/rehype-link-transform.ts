import type { Element, Root } from 'hast'
import { existsSync } from 'fs'
import { dirname, extname, relative, resolve } from 'path'
import { visit } from 'unist-util-visit'
import { getDocsTransformContext } from './context'

function toContentSlug(filePath: string, contentDir: string): string {
  const ext = extname(filePath)
  let slug = relative(contentDir, filePath).replace(/\\/g, '/')

  if (ext) {
    slug = slug.slice(0, -ext.length)
  }

  if (slug === 'README' || slug === 'index') return '/'
  if (slug.endsWith('/README')) slug = slug.slice(0, -7)
  if (slug.endsWith('/index')) slug = slug.slice(0, -6)

  return slug
}

function isInsideRoot(targetPath: string, rootDir: string): boolean {
  const rel = relative(rootDir, targetPath)
  return rel === '' || !rel.startsWith('..')
}

function splitPathSuffix(href: string): { pathPart: string; suffix: string } {
  const queryIndex = href.indexOf('?')
  const hashIndex = href.indexOf('#')
  const boundaryCandidates = [queryIndex, hashIndex].filter((index) => index >= 0)
  const boundary = boundaryCandidates.length > 0 ? Math.min(...boundaryCandidates) : -1
  return boundary >= 0
    ? { pathPart: href.slice(0, boundary), suffix: href.slice(boundary) }
    : { pathPart: href, suffix: '' }
}

function isExternalUrl(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('//')
  )
}

function hasFileExtension(path: string): boolean {
  return /\/[^/?#]+\.[^/?#]+(?:[?#].*)?$/u.test(path)
}

function formatTrailingSlash(path: string, trailingSlash: boolean): string {
  if (!path || path === '/') return '/'
  if (trailingSlash) {
    return path.endsWith('/') ? path : `${path}/`
  }
  return path.endsWith('/') ? path.slice(0, -1) : path
}

/** Resolve a relative href to a content page file path, or undefined if not a content page. */
function resolveContentTarget(
  href: string,
  currentFilePath: string,
  contentDir: string,
): string | undefined {
  const targetPath = resolve(dirname(currentFilePath), href)
  if (!isInsideRoot(targetPath, contentDir)) return undefined

  // Direct .md file
  if (existsSync(targetPath) && extname(targetPath) === '.md') {
    return targetPath
  }

  // Directory with README.md or index.md
  for (const indexFile of ['README.md', 'index.md']) {
    const candidate = resolve(targetPath, indexFile)
    if (existsSync(candidate)) return candidate
  }

  // Bare name — try appending .md
  const withMd = `${targetPath}.md`
  if (existsSync(withMd)) return withMd

  return undefined
}

export function rehypeLinkTransform() {
  return (tree: Root) => {
    const docsData = getDocsTransformContext()
    const basePath = docsData?.basePath ?? ''
    const contentDir = docsData?.contentDir
    const currentFilePath = docsData?.filePath
    const trailingSlash = docsData?.trailingSlash ?? false

    if (!contentDir || !currentFilePath) return

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return

      const href = node.properties?.href
      if (typeof href !== 'string') return

      // Skip external URLs and fragment-only links
      if (isExternalUrl(href) || href.startsWith('#')) return

      const { pathPart, suffix } = splitPathSuffix(href)
      if (!pathPart) return

      // Relative link — resolve against current file
      if (!pathPart.startsWith('/')) {
        const contentTarget = resolveContentTarget(pathPart, currentFilePath, contentDir)
        if (!contentTarget) return

        const slug = toContentSlug(contentTarget, contentDir)
        const routePath = slug === '/' ? '/' : `/${slug}`
        const formatted = formatTrailingSlash(routePath, trailingSlash)

        node.properties = node.properties || {}
        node.properties.href = `${basePath}${formatted}${suffix}`
        return
      }

      // Absolute internal link — apply basePath prefix and trailingSlash
      if (pathPart.startsWith('/') && !hasFileExtension(pathPart)) {
        // Strip existing basePath if already present to avoid double-prefix
        const cleanPath =
          basePath && pathPart.startsWith(`${basePath}/`)
            ? pathPart.slice(basePath.length)
            : pathPart === basePath
              ? '/'
              : pathPart
        const formatted = formatTrailingSlash(cleanPath, trailingSlash)

        node.properties = node.properties || {}
        node.properties.href = `${basePath}${formatted}${suffix}`
      }
    })
  }
}
