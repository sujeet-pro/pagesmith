import type { Element, Root, RootContent } from 'hast'
import { dirname, isAbsolute, relative, resolve } from 'path'
import {
  getGeneratedImageVariantPath,
  getLocalImageDimensions,
  isConvertibleImagePath,
} from '../../assets/images'

const LOCAL_IMAGE_EXT_PATTERN = /\.(svg|png|jpe?g|gif|webp|avif|ico)$/i
const IMG_TAG_PATTERN = /<img\b[^>]*>/gi
const HTML_ATTR_PATTERN = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const SIMPLE_NUMBER_PATTERN = /^\s*(\d+)(?:\.\d+)?\s*$/u
const PICTURE_TAG_PATTERN = /<\/?picture\b/gi

type HtmlAttribute = {
  name: string
  value?: string
  quote?: '"' | "'"
}

function isRelativeRef(ref: string): boolean {
  const { pathname } = splitRef(ref)
  if (!pathname) return false
  if (pathname.startsWith('/') || pathname.startsWith('//')) return false
  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(pathname)
}

function splitRef(ref: string): { pathname: string; suffix: string } {
  const pathname = ref.split(/[?#]/u, 1)[0] ?? ref
  return { pathname, suffix: ref.slice(pathname.length) }
}

function isLocalImageRef(ref: string): boolean {
  if (!isRelativeRef(ref)) return false
  return LOCAL_IMAGE_EXT_PATTERN.test(splitRef(ref).pathname)
}

function isPathInsideRoot(rootPath: string, candidatePath: string): boolean {
  const rel = relative(resolve(rootPath), resolve(candidatePath))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function resolveLocalImagePath(
  currentFilePath: string,
  ref: string,
  assetRoot: string,
): string | undefined {
  if (!isLocalImageRef(ref)) return undefined
  const { pathname } = splitRef(ref)
  const resolvedPath = resolve(dirname(currentFilePath), pathname)
  return isPathInsideRoot(assetRoot, resolvedPath) ? resolvedPath : undefined
}

function buildVariantRef(ref: string, format: 'avif' | 'webp'): string {
  const { pathname, suffix } = splitRef(ref)
  return `${getGeneratedImageVariantPath(pathname, format)}${suffix}`
}

function getNumericProperty(
  properties: Element['properties'] | undefined,
  name: 'width' | 'height',
): number | undefined {
  const value = properties?.[name]
  if (typeof value === 'number' && value > 0) return value
  if (typeof value === 'string' && SIMPLE_NUMBER_PATTERN.test(value)) {
    return Math.max(1, Math.round(Number(value)))
  }
  return undefined
}

function applyIntrinsicDimensions(
  properties: Element['properties'],
  intrinsic: { width: number; height: number },
): void {
  const width = getNumericProperty(properties, 'width')
  const height = getNumericProperty(properties, 'height')

  if (width == null && height == null) {
    properties.width = intrinsic.width
    properties.height = intrinsic.height
    return
  }

  if (width != null && height == null) {
    properties.height = Math.max(1, Math.round((width * intrinsic.height) / intrinsic.width))
    return
  }

  if (height != null && width == null) {
    properties.width = Math.max(1, Math.round((height * intrinsic.width) / intrinsic.height))
  }
}

function shouldWrapInPicture(
  src: string,
  properties: Element['properties'] | undefined,
  insidePicture = false,
): boolean {
  if (!isConvertibleImagePath(splitRef(src).pathname)) return false
  if (insidePicture) return false
  if (typeof properties?.srcset === 'string') return false
  if (typeof properties?.sizes === 'string') return false
  return true
}

function createPictureElement(img: Element, src: string): Element {
  return {
    type: 'element',
    tagName: 'picture',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(src, 'avif'),
          type: 'image/avif',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(src, 'webp'),
          type: 'image/webp',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: { ...(img.properties ?? {}) },
        children: [],
      },
    ],
  }
}

function parseHtmlAttributes(imgTag: string): { attrs: HtmlAttribute[]; selfClosing: boolean } {
  const selfClosing = /\/>\s*$/u.test(imgTag)
  const body = imgTag.replace(/^<img\b/i, '').replace(/\s*\/?>\s*$/u, '')
  const attrs: HtmlAttribute[] = []

  for (const match of body.matchAll(HTML_ATTR_PATTERN)) {
    const name = match[1]
    const rawValue = match[2] ?? match[3] ?? match[4]
    const quote = match[2] !== undefined ? '"' : match[3] !== undefined ? "'" : undefined
    attrs.push({
      name,
      value: rawValue,
      quote,
    })
  }

  return { attrs, selfClosing }
}

function renderHtmlAttributes(attrs: HtmlAttribute[]): string {
  return attrs
    .map((attr) => {
      if (attr.value == null) return ` ${attr.name}`
      const quote = attr.quote ?? '"'
      const escaped = attr.value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
      return ` ${attr.name}=${quote}${escaped}${quote}`
    })
    .join('')
}

function getHtmlAttribute(attrs: HtmlAttribute[], name: string): HtmlAttribute | undefined {
  return attrs.find((attr) => attr.name.toLowerCase() === name.toLowerCase())
}

function getNumericHtmlAttribute(attrs: HtmlAttribute[], name: string): number | undefined {
  const attr = getHtmlAttribute(attrs, name)
  if (!attr?.value || !SIMPLE_NUMBER_PATTERN.test(attr.value)) return undefined
  return Math.max(1, Math.round(Number(attr.value)))
}

function setHtmlAttribute(attrs: HtmlAttribute[], name: string, value: string): void {
  const existing = getHtmlAttribute(attrs, name)
  if (existing) {
    existing.value = value
    if (!existing.quote) existing.quote = '"'
    return
  }
  attrs.push({ name, value, quote: '"' })
}

function applyIntrinsicHtmlDimensions(
  attrs: HtmlAttribute[],
  intrinsic: { width: number; height: number },
): void {
  const width = getNumericHtmlAttribute(attrs, 'width')
  const height = getNumericHtmlAttribute(attrs, 'height')

  if (width == null && height == null) {
    setHtmlAttribute(attrs, 'width', String(intrinsic.width))
    setHtmlAttribute(attrs, 'height', String(intrinsic.height))
    return
  }

  if (width != null && height == null) {
    setHtmlAttribute(
      attrs,
      'height',
      String(Math.max(1, Math.round((width * intrinsic.height) / intrinsic.width))),
    )
    return
  }

  if (height != null && width == null) {
    setHtmlAttribute(
      attrs,
      'width',
      String(Math.max(1, Math.round((height * intrinsic.width) / intrinsic.height))),
    )
  }
}

function renderHtmlImgTag(attrs: HtmlAttribute[], selfClosing: boolean): string {
  return `<img${renderHtmlAttributes(attrs)}${selfClosing ? ' />' : '>'}`
}

function getPictureTagDelta(html: string): number {
  let delta = 0
  for (const match of html.matchAll(PICTURE_TAG_PATTERN)) {
    delta += match[0].startsWith('</') ? -1 : 1
  }
  return delta
}

function shouldWrapHtmlTagInPicture(
  attrs: HtmlAttribute[],
  src: string,
  allowPictureConversion: boolean,
): boolean {
  if (!allowPictureConversion) return false
  if (!isConvertibleImagePath(splitRef(src).pathname)) return false
  if (getHtmlAttribute(attrs, 'srcset')?.value) return false
  if (getHtmlAttribute(attrs, 'sizes')?.value) return false
  return true
}

async function transformRawImageTag(
  imgTag: string,
  currentFilePath: string,
  assetRoot: string,
  allowPictureConversion: boolean,
): Promise<string> {
  const { attrs, selfClosing } = parseHtmlAttributes(imgTag)
  const src = getHtmlAttribute(attrs, 'src')?.value
  if (typeof src !== 'string' || !isLocalImageRef(src)) return imgTag

  const sourcePath = resolveLocalImagePath(currentFilePath, src, assetRoot)
  if (!sourcePath) return imgTag

  const intrinsic = await getLocalImageDimensions(sourcePath)
  if (!intrinsic) return imgTag

  applyIntrinsicHtmlDimensions(attrs, intrinsic)

  if (!shouldWrapHtmlTagInPicture(attrs, src, allowPictureConversion)) {
    return renderHtmlImgTag(attrs, selfClosing)
  }

  const img = renderHtmlImgTag(attrs, false)
  return [
    '<picture>',
    `<source srcset="${buildVariantRef(src, 'avif').replace(/"/g, '&quot;')}" type="image/avif">`,
    `<source srcset="${buildVariantRef(src, 'webp').replace(/"/g, '&quot;')}" type="image/webp">`,
    img,
    '</picture>',
  ].join('')
}

async function transformRawHtmlImages(
  html: string,
  currentFilePath: string,
  assetRoot: string,
  parentInsidePicture = false,
): Promise<string> {
  let output = ''
  let lastIndex = 0

  for (const match of html.matchAll(IMG_TAG_PATTERN)) {
    const index = match.index ?? 0
    const imgTag = match[0]
    const before = html.slice(0, index).toLowerCase()
    const insidePicture =
      parentInsidePicture || before.lastIndexOf('<picture') > before.lastIndexOf('</picture>')
    output += html.slice(lastIndex, index)
    output += await transformRawImageTag(imgTag, currentFilePath, assetRoot, !insidePicture)
    lastIndex = index + imgTag.length
  }

  output += html.slice(lastIndex)
  return output
}

async function walk(
  node: RootContent | Root,
  currentFilePath: string,
  assetRoot: string,
  insidePicture = false,
  parent?: Root | Element,
  index?: number,
): Promise<void> {
  if (node.type === 'raw') {
    node.value = await transformRawHtmlImages(node.value, currentFilePath, assetRoot, insidePicture)
    return
  }

  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src
    if (typeof src !== 'string' || !isLocalImageRef(src)) return

    const sourcePath = resolveLocalImagePath(currentFilePath, src, assetRoot)
    if (!sourcePath) return

    const intrinsic = await getLocalImageDimensions(sourcePath)
    if (!intrinsic) return

    node.properties = node.properties || {}
    applyIntrinsicDimensions(node.properties, intrinsic)

    if (parent && index !== undefined && shouldWrapInPicture(src, node.properties, insidePicture)) {
      parent.children[index] = createPictureElement(node, src)
      return
    }
  }

  if ('children' in node && Array.isArray(node.children)) {
    let siblingInsidePicture = insidePicture
    const parentIsPicture = node.type === 'element' && node.tagName === 'picture'
    for (let childIndex = 0; childIndex < node.children.length; childIndex++) {
      const child = node.children[childIndex]
      const childInsidePicture = parentIsPicture || siblingInsidePicture
      await walk(
        child as RootContent,
        currentFilePath,
        assetRoot,
        childInsidePicture,
        node as Root | Element,
        childIndex,
      )
      if (child.type === 'raw') {
        const delta = getPictureTagDelta(child.value)
        if (delta > 0) siblingInsidePicture = true
        else if (delta < 0) siblingInsidePicture = false
      }
    }
  }
}

export function rehypeLocalImages() {
  return async (tree: Root, file: { data?: Record<string, unknown> }) => {
    const currentFilePath =
      typeof file.data?.pagesmithFilePath === 'string' ? file.data.pagesmithFilePath : undefined
    const assetRoot =
      typeof file.data?.pagesmithAssetRoot === 'string'
        ? file.data.pagesmithAssetRoot
        : currentFilePath
          ? dirname(currentFilePath)
          : undefined
    if (!currentFilePath) return
    if (!assetRoot) return
    await walk(tree, currentFilePath, assetRoot)
  }
}
