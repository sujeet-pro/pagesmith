import { existsSync, readFileSync } from 'fs'
import type { Element, Root } from 'hast'
import { basename, dirname, relative, resolve } from 'path'
import { SKIP, visit } from 'unist-util-visit'
import { getDocsTransformContext } from './context'

const ASSET_EXTS = /\.(svg|png|jpg|jpeg|gif|webp|avif|ico)$/i

function isInsideRoot(targetPath: string, rootDir: string): boolean {
  const rel = relative(rootDir, targetPath)
  return rel === '' || !rel.startsWith('..')
}

function resolveLocalAssetPath(currentFilePath: string, ref: string): string | undefined {
  if (!ref.startsWith('./')) return undefined
  const assetRoot = dirname(currentFilePath)
  const resolvedPath = resolve(assetRoot, ref.slice(2))
  return isInsideRoot(resolvedPath, assetRoot) ? resolvedPath : undefined
}

function toPublishedAssetUrl(ref: string): string {
  return `/assets/${basename(ref)}`
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

function rewriteSrcset(srcset: string): string {
  return srcset
    .split(',')
    .map((entry) => {
      const [rawUrl, ...descriptor] = entry.trim().split(/\s+/)
      if (rawUrl.startsWith('./') && ASSET_EXTS.test(rawUrl)) {
        return [toPublishedAssetUrl(rawUrl), ...descriptor].join(' ')
      }
      return entry.trim()
    })
    .join(', ')
}

export function rehypeAssetTransform() {
  return (tree: Root) => {
    const currentFilePath = getDocsTransformContext()?.filePath
    if (!currentFilePath) return

    visit(tree, 'element', (node: Element, index, parent) => {
      // Transform img src
      if (node.tagName === 'img') {
        const src = node.properties?.src
        if (typeof src !== 'string' || !src.startsWith('./') || !ASSET_EXTS.test(src)) return

        // Inline SVG: embed content directly in HTML
        if (src.endsWith('.inline.svg')) {
          const filePath = resolveLocalAssetPath(currentFilePath, src)
          if (filePath && existsSync(filePath)) {
            let svgContent = readFileSync(filePath, 'utf-8')
            // Strip XML declaration and DOCTYPE
            svgContent = svgContent.replace(/<\?xml[^?]*\?>\s*/g, '')
            svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/g, '')
            // Add accessibility and styling attributes to root <svg>
            const alt = node.properties?.alt || ''
            svgContent = svgContent.replace(
              '<svg',
              `<svg role="img" aria-label="${String(alt).replace(
                /"/g,
                '&quot;',
              )}" class="inline-svg"`,
            )
            if (parent && index !== undefined) {
              ;(parent.children as any[])[index] = { type: 'raw', value: svgContent }
              return SKIP
            }
          }
        }

        node.properties = node.properties || {}
        node.properties.src = toPublishedAssetUrl(src)

        // Add invert class for .invert. images
        if (basename(src).includes('.invert.')) {
          appendClassName(node, 'invert-on-dark')
        }
      }

      // Transform source srcset (for <picture> elements)
      if (node.tagName === 'source') {
        const srcset = node.properties?.srcset
        if (typeof srcset === 'string' && srcset.includes('./')) {
          node.properties = node.properties || {}
          node.properties.srcset = rewriteSrcset(srcset)
        }
      }

      // Transform a href pointing to asset files
      if (node.tagName === 'a') {
        const href = node.properties?.href
        if (typeof href === 'string' && href.startsWith('./') && ASSET_EXTS.test(href)) {
          node.properties = node.properties || {}
          node.properties.href = toPublishedAssetUrl(href)
        }
      }
    })
  }
}
