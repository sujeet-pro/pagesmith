/**
 * Pagesmith-owned code block DOM contract.
 *
 * Built-in renderers decorate their root HAST nodes with the class and
 * data attributes defined here before downstream plugins run. This gives
 * code tabs, runtime behavior, and CSS a stable contract that does not
 * depend on a specific renderer's DOM structure.
 */

export type HastNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  data?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

export type PagesmithCodeFrame = 'code' | 'terminal' | 'plain'

export type PagesmithCodeBlockMetadata = {
  renderer: string
  title?: string
  frame?: PagesmithCodeFrame
}

export const PAGESMITH_CODE_BLOCK_CLASS = 'ps-code-block'
export const PAGESMITH_CODE_RENDERER_ATTR = 'data-ps-code-renderer'
export const PAGESMITH_CODE_TITLE_ATTR = 'data-ps-code-title'
export const PAGESMITH_CODE_FRAME_ATTR = 'data-ps-code-frame'
export const PAGESMITH_CODE_LANG_ATTR = 'data-ps-code-lang'

function isElement(node: HastNode): boolean {
  return node.type === 'element'
}

function getClassNames(node: HastNode): string[] {
  const className = node.properties?.className
  if (Array.isArray(className))
    return className.filter((value): value is string => typeof value === 'string')
  if (typeof className === 'string') return className.split(/\s+/).filter(Boolean)
  return []
}

function setDataAttr(node: HastNode, key: string, value: string | undefined): void {
  node.properties ||= {}
  if (value === undefined) {
    delete node.properties[key]
    return
  }
  node.properties[key] = value
}

export function addClass(node: HastNode, className: string): void {
  if (!isElement(node)) return
  const classNames = new Set(getClassNames(node))
  classNames.add(className)
  node.properties ||= {}
  node.properties.className = Array.from(classNames)
}

export function hasClass(node: HastNode, className: string): boolean {
  return getClassNames(node).includes(className)
}

export function isPagesmithCodeBlock(node: HastNode): boolean {
  return isElement(node) && hasClass(node, PAGESMITH_CODE_BLOCK_CLASS)
}

export function setPagesmithCodeBlockMetadata(
  node: HastNode,
  metadata: PagesmithCodeBlockMetadata,
): void {
  if (!isElement(node)) return
  addClass(node, PAGESMITH_CODE_BLOCK_CLASS)
  setDataAttr(node, PAGESMITH_CODE_RENDERER_ATTR, metadata.renderer)
  setDataAttr(node, PAGESMITH_CODE_TITLE_ATTR, metadata.title)
  setDataAttr(node, PAGESMITH_CODE_FRAME_ATTR, metadata.frame)
}

export function getPagesmithCodeBlockTitle(node: HastNode): string | null {
  const value = node.properties?.[PAGESMITH_CODE_TITLE_ATTR]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getPagesmithCodeBlockRenderer(node: HastNode): string | null {
  const value = node.properties?.[PAGESMITH_CODE_RENDERER_ATTR]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getPagesmithCodeBlockLanguage(node: HastNode): string | null {
  const value = node.properties?.[PAGESMITH_CODE_LANG_ATTR]
  return typeof value === 'string' && value.length > 0 ? value : null
}
