import { existsSync, readFileSync } from 'fs'
import type { Element, Root, RootContent } from 'hast'
import { basename, dirname, relative, resolve } from 'path'
import { SKIP, visit } from 'unist-util-visit'
import { getDocsTransformContext } from './context'

const ASSET_EXTS = /\.(svg|png|jpg|jpeg|gif|webp|avif|ico)$/i

function isRelativeRef(ref: string): boolean {
  return ref.startsWith('./') || ref.startsWith('../')
}

function isInsideRoot(targetPath: string, rootDir: string): boolean {
  const rel = relative(rootDir, targetPath)
  return rel === '' || !rel.startsWith('..')
}

function resolveLocalAssetPath(currentFilePath: string, ref: string): string | undefined {
  if (!isRelativeRef(ref)) return undefined
  const assetRoot = dirname(currentFilePath)
  const resolvedPath = resolve(assetRoot, ref)
  return isInsideRoot(resolvedPath, assetRoot) ? resolvedPath : undefined
}

function normalizeBasePath(basePath: string): string {
  const normalized = basePath.replace(/\/+$/, '')
  return normalized === '/' ? '' : normalized
}

function splitRef(ref: string): { pathname: string; suffix: string } {
  const pathname = ref.split(/[?#]/u, 1)[0] ?? ref
  return { pathname, suffix: ref.slice(pathname.length) }
}

function toPublishedAssetPath(
  currentFilePath: string,
  contentDir: string,
  ref: string,
): string | undefined {
  if (!isRelativeRef(ref)) return undefined
  const resolvedPath = resolve(dirname(currentFilePath), ref)
  if (!isInsideRoot(resolvedPath, contentDir)) return undefined
  return relative(contentDir, resolvedPath).replace(/\\/g, '/')
}

function toPublishedAssetUrl(
  ref: string,
  basePath: string,
  currentFilePath: string,
  contentDir: string,
): string | undefined {
  const { pathname, suffix } = splitRef(ref)
  const assetPath = toPublishedAssetPath(currentFilePath, contentDir, pathname)
  if (!assetPath) return undefined
  return `${normalizeBasePath(basePath)}/assets/${assetPath}${suffix}`
}

function appendClassName(node: Element, className: string): void {
  const existing = node.properties?.className
  if (Array.isArray(existing)) {
    if (!existing.includes(className)) {
      node.properties = node.properties || {}
      node.properties.className = [...existing, className]
    }
    return
  }
  if (typeof existing === 'string') {
    const values = existing.split(/\s+/).filter(Boolean)
    if (!values.includes(className)) {
      node.properties = node.properties || {}
      node.properties.className = [...values, className]
    }
    return
  }
  node.properties = node.properties || {}
  node.properties.className = [className]
}

function rewriteSrcset(
  srcset: string,
  basePath: string,
  currentFilePath: string,
  contentDir: string,
): string {
  return srcset
    .split(',')
    .map((entry) => {
      const [rawUrl, ...descriptor] = entry.trim().split(/\s+/)
      if (isRelativeRef(rawUrl) && ASSET_EXTS.test(splitRef(rawUrl).pathname)) {
        const rewrittenUrl = toPublishedAssetUrl(rawUrl, basePath, currentFilePath, contentDir)
        if (rewrittenUrl) {
          return [rewrittenUrl, ...descriptor].join(' ')
        }
      }
      return entry.trim()
    })
    .join(', ')
}

function rewriteRawAssetAttributes(
  html: string,
  basePath: string,
  currentFilePath: string,
  contentDir: string,
): string {
  const rewriteRefAttribute = (value: string): string =>
    value.replace(
      /\b(src|href)=("|')([^"']*)\2/gi,
      (match, attr: string, quote: string, ref: string) => {
        if (!(isRelativeRef(ref) && ASSET_EXTS.test(splitRef(ref).pathname))) {
          return match
        }

        const rewrittenUrl = toPublishedAssetUrl(ref, basePath, currentFilePath, contentDir)
        return rewrittenUrl ? `${attr}=${quote}${rewrittenUrl}${quote}` : match
      },
    )

  return rewriteRefAttribute(html).replace(
    /\bsrcset=("|')([^"']*)\1/gi,
    (match, quote: string, srcset: string) =>
      srcset.includes('./')
        ? `srcset=${quote}${rewriteSrcset(srcset, basePath, currentFilePath, contentDir)}${quote}`
        : match,
  )
}

export function rehypeAssetTransform() {
  return (tree: Root) => {
    const context = getDocsTransformContext()
    if (!context?.filePath) return

    visit(tree, 'raw', (node) => {
      node.value = rewriteRawAssetAttributes(
        node.value,
        context.basePath,
        context.filePath,
        context.contentDir,
      )
    })

    visit(tree, 'element', (element: Element, index, parent) => {
      // Transform img src
      if (element.tagName === 'img') {
        const src = element.properties?.src
        if (
          typeof src !== 'string' ||
          !isRelativeRef(src) ||
          !ASSET_EXTS.test(splitRef(src).pathname)
        ) {
          return
        }

        // Inline SVG: embed content directly in HTML
        if (src.endsWith('.inline.svg')) {
          const filePath = resolveLocalAssetPath(context.filePath, src)
          if (filePath && existsSync(filePath)) {
            let svgContent = readFileSync(filePath, 'utf-8')
            // Strip XML declaration and DOCTYPE
            svgContent = svgContent.replace(/<\?xml[^?]*\?>\s*/g, '')
            svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/g, '')
            // Add accessibility and styling attributes to root <svg>
            const alt = element.properties?.alt || ''
            svgContent = svgContent.replace(
              '<svg',
              `<svg role="img" aria-label="${String(alt).replace(
                /"/g,
                '&quot;',
              )}" class="inline-svg"`,
            )
            if (parent && index !== undefined) {
              ;(parent.children as RootContent[])[index] = { type: 'raw', value: svgContent }
              return SKIP
            }
          }
        }

        const publishedUrl = toPublishedAssetUrl(
          src,
          context.basePath,
          context.filePath,
          context.contentDir,
        )
        if (!publishedUrl) return

        element.properties = element.properties || {}
        element.properties.src = publishedUrl

        // Add invert class for .invert. images
        if (basename(src).includes('.invert.')) {
          appendClassName(element, 'invert-on-dark')
        }
      }

      // Transform source srcset (for <picture> elements)
      if (element.tagName === 'source') {
        const srcset = element.properties?.srcset
        if (typeof srcset === 'string' && (srcset.includes('./') || srcset.includes('../'))) {
          element.properties = element.properties || {}
          element.properties.srcset = rewriteSrcset(
            srcset,
            context.basePath,
            context.filePath,
            context.contentDir,
          )
        }
      }

      // Transform a href pointing to asset files
      if (element.tagName === 'a') {
        const href = element.properties?.href
        if (
          typeof href === 'string' &&
          isRelativeRef(href) &&
          ASSET_EXTS.test(splitRef(href).pathname)
        ) {
          const publishedUrl = toPublishedAssetUrl(
            href,
            context.basePath,
            context.filePath,
            context.contentDir,
          )
          if (!publishedUrl) return

          element.properties = element.properties || {}
          element.properties.href = publishedUrl
        }
      }
    })
  }
}
