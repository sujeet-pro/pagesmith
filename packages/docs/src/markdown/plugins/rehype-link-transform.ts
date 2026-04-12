import type { Element, Root } from 'hast'
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

export function rehypeLinkTransform() {
  return (tree: Root) => {
    const docsData = getDocsTransformContext()
    const basePath = docsData?.basePath ?? ''
    const contentDir = docsData?.contentDir
    const currentFilePath = docsData?.filePath

    if (!contentDir || !currentFilePath) return

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return

      const href = node.properties?.href
      if (typeof href !== 'string') return

      // Skip external URLs
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return
      }

      if (href.includes('.md')) {
        const { pathPart, suffix } = splitPathSuffix(href)
        if (!pathPart.endsWith('.md')) return

        const targetPath = resolve(dirname(currentFilePath), pathPart)
        if (!isInsideRoot(targetPath, contentDir)) return

        const slug = toContentSlug(targetPath, contentDir)
        const routePath = slug === '/' ? '/' : `/${slug}`

        node.properties = node.properties || {}
        node.properties.href = `${basePath}${routePath}${suffix}`
        return
      }

      if (
        basePath &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        href !== basePath &&
        !href.startsWith(`${basePath}/`)
      ) {
        node.properties = node.properties || {}
        node.properties.href = `${basePath}${href}`
      }
    })
  }
}
