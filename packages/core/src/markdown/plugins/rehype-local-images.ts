import type { Element, ElementContent, Root, RootContent } from 'hast'
import { dirname, extname, isAbsolute, relative, resolve } from 'path'
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
const LIGHT_DARK_STEM_PATTERN = /^(.+)-(?:light|dark)$/i
const SVG_EXT = '.svg'

type HtmlAttribute = {
  name: string
  value?: string
  quote?: '"' | "'"
}

// ── Shared helpers ──

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

function isSvgRef(ref: string): boolean {
  return extname(splitRef(ref).pathname).toLowerCase() === SVG_EXT
}

function isRasterRef(ref: string): boolean {
  return isConvertibleImagePath(splitRef(ref).pathname)
}

/**
 * Parse a filename into { stem, variant, ext } where variant is 'light' | 'dark' | undefined.
 * E.g. "chart-light.png" → { stem: "chart", variant: "light", ext: ".png" }
 */
function parseLightDarkFilename(
  ref: string,
): { stem: string; variant: 'light' | 'dark'; ext: string } | undefined {
  const { pathname } = splitRef(ref)
  const ext = extname(pathname)
  const base = pathname.slice(0, -ext.length)
  // Get just the filename portion (after the last /)
  const lastSlash = base.lastIndexOf('/')
  const dirPart = lastSlash >= 0 ? base.slice(0, lastSlash + 1) : ''
  const namePart = lastSlash >= 0 ? base.slice(lastSlash + 1) : base
  const match = namePart.match(LIGHT_DARK_STEM_PATTERN)
  if (!match) return undefined
  const variant = namePart.toLowerCase().endsWith('-light') ? 'light' : 'dark'
  return { stem: `${dirPart}${match[1]}`, variant, ext }
}

// ── Dimension helpers ──

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

function applyMaxWidthStyle(properties: Element['properties'], widthPx: number): void {
  const maxWidthRule = `max-width:min(${widthPx}px,100%)`
  const existing = typeof properties.style === 'string' ? properties.style : ''
  properties.style = existing ? `${existing.replace(/;\s*$/, '')};${maxWidthRule}` : maxWidthRule
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
    applyMaxWidthStyle(properties, intrinsic.width)
    return
  }

  if (width != null && height == null) {
    properties.height = Math.max(1, Math.round((width * intrinsic.height) / intrinsic.width))
    applyMaxWidthStyle(properties, width)
    return
  }

  if (height != null && width == null) {
    const computedWidth = Math.max(1, Math.round((height * intrinsic.width) / intrinsic.height))
    properties.width = computedWidth
    applyMaxWidthStyle(properties, computedWidth)
  }
}

// ── HAST element builders ──

function shouldWrapInPicture(
  src: string,
  properties: Element['properties'] | undefined,
  insidePicture = false,
): boolean {
  if (isSvgRef(src)) return false
  // Only wrap convertible images — .avif source files don't need picture wrapping
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
        properties: {
          ...(img.properties ?? {}),
          // Use webp as the fallback src for broadest modern browser support
          src: buildVariantRef(src, 'webp'),
        },
        children: [],
      },
    ],
  }
}

function createThemedPictureElement(img: Element, lightSrc: string, darkSrc: string): Element {
  return {
    type: 'element',
    tagName: 'picture',
    properties: {},
    children: [
      // Dark variants first (with media query)
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(darkSrc, 'avif'),
          type: 'image/avif',
          media: '(prefers-color-scheme: dark)',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(darkSrc, 'webp'),
          type: 'image/webp',
          media: '(prefers-color-scheme: dark)',
        },
        children: [],
      },
      // Light variants (default — no media query)
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(lightSrc, 'avif'),
          type: 'image/avif',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'source',
        properties: {
          srcset: buildVariantRef(lightSrc, 'webp'),
          type: 'image/webp',
        },
        children: [],
      },
      // Fallback img with light webp
      {
        type: 'element',
        tagName: 'img',
        properties: {
          ...(img.properties ?? {}),
          src: buildVariantRef(lightSrc, 'webp'),
        },
        children: [],
      },
    ],
  }
}

function createFigureElement(
  content: Element,
  title: string | undefined,
  classNames: string[],
): Element {
  const children: ElementContent[] = [content]
  if (title) {
    children.push({
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: [{ type: 'text', value: title }],
    })
  }
  return {
    type: 'element',
    tagName: 'figure',
    properties: { className: classNames },
    children,
  }
}

// ── Light/dark pair detection for HAST nodes ──

type ImageCandidate = {
  index: number
  src: string
  parsed: { stem: string; variant: 'light' | 'dark'; ext: string }
  node: Element
}

function isWhitespaceTextNode(node: RootContent): boolean {
  return node.type === 'text' && /^\s*$/u.test((node as { value: string }).value)
}

function getImageSrc(node: RootContent): string | undefined {
  if (node.type !== 'element') return undefined
  if (node.tagName === 'img')
    return typeof node.properties?.src === 'string' ? node.properties.src : undefined
  // Also check if it's a p wrapping a single img (markdown wraps images in <p>)
  if (node.tagName === 'p' && node.children?.length === 1) {
    const child = node.children[0] as Element
    if (child?.type === 'element' && child.tagName === 'img') {
      return typeof child.properties?.src === 'string' ? child.properties.src : undefined
    }
  }
  return undefined
}

function getImageElement(node: RootContent): Element | undefined {
  if (node.type !== 'element') return undefined
  if (node.tagName === 'img') return node
  if (node.tagName === 'p' && node.children?.length === 1) {
    const child = node.children[0] as Element
    if (child?.type === 'element' && child.tagName === 'img') return child
  }
  return undefined
}

/**
 * Scan parent children for consecutive light/dark image pairs and merge them.
 * Returns indices that were consumed by pairs (to skip during normal processing).
 */
function detectAndMergePairs(
  parent: Root | Element,
  currentFilePath: string,
  assetRoot: string,
): Set<number> {
  const consumed = new Set<number>()
  const children = parent.children as RootContent[]
  if (children.length < 2) return consumed

  let i = 0
  while (i < children.length - 1) {
    const srcA = getImageSrc(children[i])
    if (!srcA || !isLocalImageRef(srcA)) {
      i++
      continue
    }

    const parsedA = parseLightDarkFilename(srcA)
    if (!parsedA) {
      i++
      continue
    }

    // Look ahead for the matching pair (skip whitespace)
    let j = i + 1
    while (j < children.length && isWhitespaceTextNode(children[j])) j++
    if (j >= children.length) {
      i++
      continue
    }

    const srcB = getImageSrc(children[j])
    if (!srcB || !isLocalImageRef(srcB)) {
      i++
      continue
    }

    const parsedB = parseLightDarkFilename(srcB)
    if (!parsedB) {
      i++
      continue
    }

    // Check they form a valid light/dark pair
    if (parsedA.stem !== parsedB.stem || parsedA.variant === parsedB.variant) {
      i++
      continue
    }

    const lightSrc = parsedA.variant === 'light' ? srcA : srcB
    const darkSrc = parsedA.variant === 'dark' ? srcA : srcB
    const lightImg =
      parsedA.variant === 'light' ? getImageElement(children[i])! : getImageElement(children[j])!

    // Use light image's properties (alt, title, dimensions)
    const title =
      typeof lightImg.properties?.title === 'string' ? lightImg.properties.title : undefined
    // Remove title from img properties (it goes to figcaption)
    const imgProps = { ...(lightImg.properties ?? {}) }
    delete imgProps.title

    const themedPicture = createThemedPictureElement(
      { ...lightImg, properties: imgProps } as Element,
      lightSrc,
      darkSrc,
    )
    const figure = createFigureElement(themedPicture, title, ['ps-figure', 'ps-figure-themed'])

    // Replace the first image with the merged figure, mark everything between for removal
    children[i] = figure as unknown as RootContent
    consumed.add(i) // Mark as already processed
    for (let k = i + 1; k <= j; k++) consumed.add(k)

    // Remove consumed nodes (j down to i+1)
    children.splice(i + 1, j - i)

    i++ // Move past the merged figure
  }

  return consumed
}

// ── Raw HTML helpers ──

function parseHtmlAttributes(imgTag: string): { attrs: HtmlAttribute[]; selfClosing: boolean } {
  const selfClosing = /\/>\s*$/u.test(imgTag)
  const body = imgTag.replace(/^<img\b/i, '').replace(/\s*\/?>\s*$/u, '')
  const attrs: HtmlAttribute[] = []

  for (const match of body.matchAll(HTML_ATTR_PATTERN)) {
    const name = match[1]
    const rawValue = match[2] ?? match[3] ?? match[4]
    const quote = match[2] !== undefined ? '"' : match[3] !== undefined ? "'" : undefined
    attrs.push({ name, value: rawValue, quote })
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

function removeHtmlAttribute(attrs: HtmlAttribute[], name: string): void {
  const idx = attrs.findIndex((attr) => attr.name.toLowerCase() === name.toLowerCase())
  if (idx >= 0) attrs.splice(idx, 1)
}

function applyMaxWidthHtmlStyle(attrs: HtmlAttribute[], widthPx: number): void {
  const maxWidthRule = `max-width:min(${widthPx}px,100%)`
  const existing = getHtmlAttribute(attrs, 'style')?.value ?? ''
  const value = existing ? `${existing.replace(/;\s*$/, '')};${maxWidthRule}` : maxWidthRule
  setHtmlAttribute(attrs, 'style', value)
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
    applyMaxWidthHtmlStyle(attrs, intrinsic.width)
    return
  }

  if (width != null && height == null) {
    setHtmlAttribute(
      attrs,
      'height',
      String(Math.max(1, Math.round((width * intrinsic.height) / intrinsic.width))),
    )
    applyMaxWidthHtmlStyle(attrs, width)
    return
  }

  if (height != null && width == null) {
    const computedWidth = Math.max(1, Math.round((height * intrinsic.width) / intrinsic.height))
    setHtmlAttribute(attrs, 'width', String(computedWidth))
    applyMaxWidthHtmlStyle(attrs, computedWidth)
  }
}

function renderHtmlImgTag(attrs: HtmlAttribute[]): string {
  return `<img${renderHtmlAttributes(attrs)}>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  if (isSvgRef(src)) return false
  if (!isConvertibleImagePath(splitRef(src).pathname)) return false
  if (getHtmlAttribute(attrs, 'srcset')?.value) return false
  if (getHtmlAttribute(attrs, 'sizes')?.value) return false
  return true
}

function buildHtmlPictureWithFigure(attrs: HtmlAttribute[], src: string): string {
  const title = getHtmlAttribute(attrs, 'title')?.value
  removeHtmlAttribute(attrs, 'title')
  // Change img src to webp fallback
  setHtmlAttribute(attrs, 'src', buildVariantRef(src, 'webp'))
  const img = renderHtmlImgTag(attrs)
  const avifSrcset = escapeHtml(buildVariantRef(src, 'avif'))
  const webpSrcset = escapeHtml(buildVariantRef(src, 'webp'))
  const figcaption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ''
  return [
    '<figure class="ps-figure">',
    '<picture>',
    `<source srcset="${avifSrcset}" type="image/avif">`,
    `<source srcset="${webpSrcset}" type="image/webp">`,
    img,
    '</picture>',
    figcaption,
    '</figure>',
  ]
    .filter(Boolean)
    .join('')
}

function buildHtmlSvgFigure(attrs: HtmlAttribute[]): string {
  const title = getHtmlAttribute(attrs, 'title')?.value
  removeHtmlAttribute(attrs, 'title')
  const img = renderHtmlImgTag(attrs)
  const figcaption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ''
  return ['<figure class="ps-figure">', img, figcaption, '</figure>'].filter(Boolean).join('')
}

async function transformRawImageTag(
  imgTag: string,
  currentFilePath: string,
  assetRoot: string,
  allowPictureConversion: boolean,
): Promise<string> {
  const { attrs } = parseHtmlAttributes(imgTag)
  const src = getHtmlAttribute(attrs, 'src')?.value
  if (typeof src !== 'string' || !isLocalImageRef(src)) return imgTag

  const sourcePath = resolveLocalImagePath(currentFilePath, src, assetRoot)
  if (!sourcePath) return imgTag

  const intrinsic = await getLocalImageDimensions(sourcePath)
  if (!intrinsic) return imgTag

  applyIntrinsicHtmlDimensions(attrs, intrinsic)

  if (isSvgRef(src)) {
    return buildHtmlSvgFigure(attrs)
  }

  if (shouldWrapHtmlTagInPicture(attrs, src, allowPictureConversion)) {
    return buildHtmlPictureWithFigure(attrs, src)
  }

  // Non-convertible raster or already inside picture — just figure wrap
  const title = getHtmlAttribute(attrs, 'title')?.value
  removeHtmlAttribute(attrs, 'title')
  const img = renderHtmlImgTag(attrs)
  const figcaption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ''
  return `<figure class="ps-figure">${img}${figcaption}</figure>`
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
    const insideFigure = before.lastIndexOf('<figure') > before.lastIndexOf('</figure>')
    output += html.slice(lastIndex, index)

    if (insideFigure) {
      // Already inside a figure — don't re-wrap, just apply dimensions
      const { attrs } = parseHtmlAttributes(imgTag)
      const src = getHtmlAttribute(attrs, 'src')?.value
      if (typeof src === 'string' && isLocalImageRef(src)) {
        const sourcePath = resolveLocalImagePath(currentFilePath, src, assetRoot)
        if (sourcePath) {
          const intrinsic = await getLocalImageDimensions(sourcePath)
          if (intrinsic) applyIntrinsicHtmlDimensions(attrs, intrinsic)
        }
      }
      output += renderHtmlImgTag(attrs)
    } else {
      output += await transformRawImageTag(imgTag, currentFilePath, assetRoot, !insidePicture)
    }
    lastIndex = index + imgTag.length
  }

  output += html.slice(lastIndex)
  return output
}

// ── HAST tree walker ──

async function processImageNode(
  node: Element,
  currentFilePath: string,
  assetRoot: string,
  insidePicture: boolean,
  insideLink: boolean,
  parent?: Root | Element,
  index?: number,
): Promise<void> {
  const src = node.properties?.src
  if (typeof src !== 'string' || !isLocalImageRef(src)) return

  const sourcePath = resolveLocalImagePath(currentFilePath, src, assetRoot)
  if (!sourcePath) return

  const intrinsic = await getLocalImageDimensions(sourcePath)
  if (!intrinsic) return

  node.properties = node.properties || {}
  applyIntrinsicDimensions(node.properties, intrinsic)

  // Don't figure-wrap images inside links — it would break the link structure
  if (insideLink || !parent || index === undefined) return

  const title = typeof node.properties.title === 'string' ? node.properties.title : undefined
  // Remove title from img (it will go to figcaption)
  delete node.properties.title

  let innerContent: Element

  if (shouldWrapInPicture(src, node.properties, insidePicture)) {
    innerContent = createPictureElement(node, src)
  } else {
    innerContent = node
  }

  const figure = createFigureElement(innerContent, title, ['ps-figure'])
  parent.children[index] = figure as unknown as RootContent
}

async function walk(
  node: RootContent | Root,
  currentFilePath: string,
  assetRoot: string,
  insidePicture = false,
  insideFigure = false,
  insideLink = false,
  parent?: Root | Element,
  index?: number,
): Promise<void> {
  if (node.type === 'raw') {
    node.value = await transformRawHtmlImages(node.value, currentFilePath, assetRoot, insidePicture)
    return
  }

  if (node.type === 'element' && node.tagName === 'img' && !insideFigure) {
    await processImageNode(
      node,
      currentFilePath,
      assetRoot,
      insidePicture,
      insideLink,
      parent,
      index,
    )
    return
  }

  if ('children' in node && Array.isArray(node.children)) {
    const parentElement = node as Root | Element

    // First pass: detect and merge light/dark pairs (only at block-level parents)
    if (!insideFigure && !insidePicture && !insideLink) {
      detectAndMergePairs(parentElement, currentFilePath, assetRoot)
    }

    // Second pass: walk remaining children
    let siblingInsidePicture = insidePicture
    const parentIsPicture = node.type === 'element' && node.tagName === 'picture'
    const parentIsFigure = node.type === 'element' && node.tagName === 'figure'
    const parentIsLink = node.type === 'element' && node.tagName === 'a'
    for (let childIndex = 0; childIndex < node.children.length; childIndex++) {
      const child = node.children[childIndex]
      const childInsidePicture = parentIsPicture || siblingInsidePicture
      const childInsideFigure = parentIsFigure || insideFigure
      const childInsideLink = parentIsLink || insideLink

      // Skip already-processed figures from pair detection
      if (
        child.type === 'element' &&
        child.tagName === 'figure' &&
        Array.isArray(child.properties?.className) &&
        (child.properties.className as string[]).includes('ps-figure')
      ) {
        continue
      }

      await walk(
        child as RootContent,
        currentFilePath,
        assetRoot,
        childInsidePicture,
        childInsideFigure,
        childInsideLink,
        parentElement,
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
