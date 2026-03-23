/**
 * Rehype plugin: rewrite diagram image references to rendered SVGs.
 *
 * When markdown references a diagram source file as an image:
 *   ![Alt text](./flow.mermaid)
 *   ![Alt text](./arch.excalidraw)
 *
 * This plugin rewrites the <img> to reference the rendered SVGs from the
 * hidden .diagrams/ folder, with automatic light/dark theme support.
 *
 * Two display modes:
 *   - "picture" (default): uses <picture> + <source media="(prefers-color-scheme: dark)">
 *   - "class": uses two <img> tags with .only-light / .only-dark classes
 *
 * If the original <img> is inside a <figure>, the wrapper is preserved.
 */

import { DIAGRAMS_DIR, getExtensionMap, getMatchedExtension, type DiagramType } from 'diagramkit'
import type { Element, ElementContent, Root } from 'hast'
import { visit } from 'unist-util-visit'

export type DiagramImageMode = 'picture' | 'class'

export interface RehypeDiagramImagesOptions {
  /** Display mode for light/dark variants. Default: "picture". */
  mode?: DiagramImageMode
  /** Generated output folder name. Defaults to diagramkit's `.diagrams`. */
  outputDir?: string
  /** Custom diagram extension aliases. */
  extensionMap?: Record<string, DiagramType>
}

/**
 * Rehype plugin that rewrites diagram source references to rendered SVG paths.
 *
 * Transforms:
 *   <img src="./flow.mermaid" alt="Flow diagram">
 * Into (picture mode):
 *   <picture>
 *     <source srcset=".diagrams/flow-dark.svg" media="(prefers-color-scheme: dark)">
 *     <img src=".diagrams/flow-light.svg" alt="Flow diagram">
 *   </picture>
 * Or (class mode):
 *   <img src=".diagrams/flow-light.svg" alt="Flow diagram" class="only-light">
 *   <img src=".diagrams/flow-dark.svg" alt="Flow diagram" class="only-dark">
 */
export function rehypeDiagramImages(options: RehypeDiagramImagesOptions = {}) {
  const mode = options.mode ?? 'picture'
  const outputDir = options.outputDir ?? DIAGRAMS_DIR
  const extensionMap = getExtensionMap(options.extensionMap)

  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'img') return
      if (index === undefined || !parent) return

      const src = node.properties?.src
      if (typeof src !== 'string') return
      if (!src.startsWith('./')) return

      const withoutPrefix = src.slice(2)
      const matchedExtension = getMatchedExtension(withoutPrefix, extensionMap)
      if (!matchedExtension) return
      const name = withoutPrefix.slice(0, -matchedExtension.length)

      // Build paths to rendered SVGs in .diagrams/ folder.
      // The .diagrams/ folder is a sibling of the source file, and the
      // markdown references are relative to the markdown file's directory,
      // so the SVG paths are relative the same way.
      const lightSrc = `./${outputDir}/${name}-light.svg`
      const darkSrc = `./${outputDir}/${name}-dark.svg`

      const alt = node.properties?.alt ?? ''

      if (mode === 'picture') {
        // Replace <img> with <picture> containing dark <source> + light <img>
        const pictureNode: Element = {
          type: 'element',
          tagName: 'picture',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'source',
              properties: {
                srcset: darkSrc,
                media: '(prefers-color-scheme: dark)',
              },
              children: [],
            },
            {
              type: 'element',
              tagName: 'img',
              properties: {
                src: lightSrc,
                alt,
              },
              children: [],
            },
          ],
        }

        ;(parent.children as ElementContent[])[index] = pictureNode
      } else {
        // Class mode: replace <img> with two <img> tags
        const lightImg: Element = {
          type: 'element',
          tagName: 'img',
          properties: {
            src: lightSrc,
            alt,
            className: ['only-light'],
          },
          children: [],
        }
        const darkImg: Element = {
          type: 'element',
          tagName: 'img',
          properties: {
            src: darkSrc,
            alt,
            className: ['only-dark'],
          },
          children: [],
        } // Replace the single <img> with two <img> elements
        ;(parent.children as ElementContent[]).splice(index, 1, lightImg, darkImg)
      }
    })
  }
}
