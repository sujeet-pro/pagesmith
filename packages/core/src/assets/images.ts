import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import sharp from 'sharp'
import type { ContentAssetMap } from './index'

export const CONVERTIBLE_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
export const GENERATED_IMAGE_FORMATS = ['avif', 'webp'] as const

export type GeneratedImageFormat = (typeof GENERATED_IMAGE_FORMATS)[number]

export type LocalImageDimensions = {
  width: number
  height: number
}

const SVG_EXT = '.svg'
const SVG_ROOT_TAG_PATTERN = /<svg\b([^>]*)>/i
const VIEWBOX_PATTERN = /viewBox\s*=\s*(['"])([^'"]+)\1/i
const WIDTH_PATTERN = /width\s*=\s*(['"])([^'"]+)\1/i
const HEIGHT_PATTERN = /height\s*=\s*(['"])([^'"]+)\1/i
const SIMPLE_LENGTH_PATTERN = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:px)?\s*$/i

const dimensionCache = new Map<string, Promise<LocalImageDimensions | undefined>>()
const MAX_DIMENSION_CACHE_ENTRIES = 512

function normalizeAssetPath(assetPath: string): string {
  return assetPath.replace(/\\/g, '/')
}

function findAssetPathKey(assets: ContentAssetMap, assetPath: string): string | undefined {
  if (assets.byPath.has(assetPath)) return assetPath

  const normalized = normalizeAssetPath(assetPath)
  if (assets.byPath.has(normalized)) return normalized

  for (const key of assets.byPath.keys()) {
    if (normalizeAssetPath(key) === normalized) return key
  }

  return undefined
}

function setDimensionCacheEntry(
  cacheKey: string,
  pending: Promise<LocalImageDimensions | undefined>,
): void {
  dimensionCache.set(cacheKey, pending)
  if (dimensionCache.size <= MAX_DIMENSION_CACHE_ENTRIES) return

  const oldestKey = dimensionCache.keys().next().value
  if (typeof oldestKey === 'string') {
    dimensionCache.delete(oldestKey)
  }
}

function roundPositiveDimension(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value) || value <= 0) return undefined
  return Math.max(1, Math.round(value))
}

function parseSimpleLength(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = value.match(SIMPLE_LENGTH_PATTERN)
  if (!match) return undefined
  const parsed = Number(match[1])
  return roundPositiveDimension(parsed)
}

function parseSvgViewBox(source: string): { width: number; height: number } | undefined {
  const match = source.match(VIEWBOX_PATTERN)
  if (!match) return undefined

  const parts = match[2]
    .split(/[\s,]+/u)
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part))

  if (parts.length !== 4) return undefined

  const width = roundPositiveDimension(parts[2])
  const height = roundPositiveDimension(parts[3])
  if (!width || !height) return undefined

  return { width, height }
}

function parseSvgDimensions(sourcePath: string): LocalImageDimensions | undefined {
  const svg = readFileSync(sourcePath, 'utf-8')
  const rootMatch = svg.match(SVG_ROOT_TAG_PATTERN)
  if (!rootMatch) return undefined

  const rootTag = rootMatch[0]
  const width = parseSimpleLength(rootTag.match(WIDTH_PATTERN)?.[2])
  const height = parseSimpleLength(rootTag.match(HEIGHT_PATTERN)?.[2])
  const viewBox = parseSvgViewBox(rootTag)

  if (width && height) return { width, height }

  if (viewBox) {
    if (width && !height) {
      return {
        width,
        height: roundPositiveDimension((width * viewBox.height) / viewBox.width) ?? viewBox.height,
      }
    }
    if (height && !width) {
      return {
        width: roundPositiveDimension((height * viewBox.width) / viewBox.height) ?? viewBox.width,
        height,
      }
    }
    return viewBox
  }

  return undefined
}

export async function getLocalImageDimensions(
  sourcePath: string,
): Promise<LocalImageDimensions | undefined> {
  if (!existsSync(sourcePath)) return undefined

  const stat = statSync(sourcePath)
  const cacheKey = `${sourcePath}:${stat.mtimeMs}:${stat.size}`
  const cached = dimensionCache.get(cacheKey)
  if (cached) return cached

  const ext = extname(sourcePath).toLowerCase()
  const pending =
    ext === SVG_EXT
      ? Promise.resolve(parseSvgDimensions(sourcePath))
      : sharp(sourcePath)
          .metadata()
          .then((metadata) => {
            const width = roundPositiveDimension(metadata.autoOrient.width ?? metadata.width)
            const height = roundPositiveDimension(metadata.autoOrient.height ?? metadata.height)
            if (!width || !height) return undefined
            return { width, height }
          })
          .catch((error) => {
            console.warn(
              `[pagesmith] Failed to read local image metadata for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
            )
            return undefined
          })

  setDimensionCacheEntry(cacheKey, pending)
  return pending
}

export function isConvertibleImagePath(assetPath: string): boolean {
  return CONVERTIBLE_IMAGE_EXTS.has(extname(assetPath).toLowerCase())
}

export function getGeneratedImageVariantPath(
  assetPath: string,
  format: GeneratedImageFormat,
): string {
  const ext = extname(assetPath)
  return `${assetPath.slice(0, -ext.length)}.${format}`
}

export function resolveGeneratedImageSourceAssetPath(
  assetPath: string,
  assets: ContentAssetMap,
): string | undefined {
  const ext = extname(assetPath).toLowerCase()
  if (ext !== '.avif' && ext !== '.webp') return undefined

  const stem = assetPath.slice(0, -ext.length)
  for (const sourceExt of CONVERTIBLE_IMAGE_EXTS) {
    const candidate = `${stem}${sourceExt}`
    const resolvedKey = findAssetPathKey(assets, candidate)
    if (resolvedKey) return resolvedKey
  }

  return undefined
}

export function resolveGeneratedImageSourcePath(
  assetPath: string,
  assets: ContentAssetMap,
): string | undefined {
  const sourceAssetPath = resolveGeneratedImageSourceAssetPath(assetPath, assets)
  return sourceAssetPath ? assets.byPath.get(sourceAssetPath) : undefined
}

export async function renderGeneratedImageVariant(
  sourcePath: string,
  format: GeneratedImageFormat,
): Promise<Buffer> {
  const pipeline = sharp(sourcePath).autoOrient()
  if (format === 'avif') {
    return pipeline.avif().toBuffer()
  }
  return pipeline.webp().toBuffer()
}

export async function emitGeneratedImageVariants(
  assetsDir: string,
  assets: ContentAssetMap,
): Promise<void> {
  const pending: Promise<void>[] = []

  for (const [assetPath, sourcePath] of assets.byPath) {
    if (!isConvertibleImagePath(assetPath)) continue

    for (const format of GENERATED_IMAGE_FORMATS) {
      const destPath = join(assetsDir, getGeneratedImageVariantPath(assetPath, format))
      pending.push(
        renderGeneratedImageVariant(sourcePath, format)
          .then((buffer) => {
            mkdirSync(dirname(destPath), { recursive: true })
            writeFileSync(destPath, buffer)
          })
          .catch((error) => {
            console.warn(
              `pagesmith: failed to emit generated ${format} image for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
            )
          }),
      )
    }
  }

  await Promise.all(pending)
}
