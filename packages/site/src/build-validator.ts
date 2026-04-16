/**
 * Post-build output validator.
 *
 * Walks a static site output directory and checks:
 *  - Internal links resolve to existing files
 *  - Image sources (src, srcset) resolve to existing files
 *  - All images in /assets/ carry a content hash in the filename
 *  - SVG files are well-formed (parseable, no error text)
 *
 * Designed for use after `hashAssets()` runs so all images should
 * already have hashed filenames. Accepts trailing-slash and basePath
 * settings to correctly resolve HTML file locations.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { basename, dirname, extname, join, relative } from 'path'

// ── Types ──

export type BuildValidatorOptions = {
  /** Absolute path to the build output directory to validate. */
  outDir: string
  /** Base path prefix used in URLs (e.g. "/pagesmith"). Default: "" */
  basePath?: string
  /** Whether the build uses trailing slashes (path/index.html vs path.html). Default: false */
  trailingSlash?: boolean
  /** Directory names to exclude from validation (e.g. ["examples", "pagefind"]). Default: ["pagefind"] */
  exclude?: string[]
}

export type BuildValidationIssue = {
  file: string
  message: string
  severity: 'error' | 'warn'
}

export type BuildValidationResult = {
  errors: BuildValidationIssue[]
  warnings: BuildValidationIssue[]
  htmlFileCount: number
  imageFileCount: number
  passed: boolean
}

// ── Constants ──

const HASH_SUFFIX_PATTERN = /\.[a-f0-9]{8}\.[^.]+$/i

const IMAGE_EXTS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico'])

const EXTERNAL_PATTERN = /^(https?:|\/\/|#|data:|mailto:|tel:|javascript:|blob:)/i

const SVG_ERROR_PATTERNS = [/<parsererror[\s>]/i, /Syntax error/i, /<error[\s>]/i]

// ── Helpers ──

const DEFAULT_EXCLUDE = ['pagefind']

function walkFiles(dir: string, ext?: string, excludeDirs?: Set<string>): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (excludeDirs?.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, ext, excludeDirs))
    } else if (!ext || extname(entry.name) === ext) {
      results.push(full)
    }
  }
  return results
}

function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function isExternal(href: string): boolean {
  return EXTERNAL_PATTERN.test(href)
}

function stripQueryHash(href: string): string {
  return href.split(/[?#]/)[0] ?? href
}

function stripCodeContent(html: string): string {
  return html.replace(/<(pre|code)[\s>][\s\S]*?<\/\1>/gi, '')
}

function isRedirect(content: string): boolean {
  return /http-equiv=["']?refresh["']?/i.test(content)
}

function hasContentHash(fileName: string): boolean {
  return HASH_SUFFIX_PATTERN.test(fileName)
}

function isImageFile(path: string): boolean {
  return IMAGE_EXTS.has(extname(path).toLowerCase())
}

/**
 * Resolve a local href to an absolute filesystem path within the output directory.
 * Returns null for external/anchor/data URLs.
 */
function resolveLocalHref(
  href: string,
  htmlFile: string,
  outDir: string,
  basePath: string,
  trailingSlash: boolean,
): string | null {
  if (isExternal(href)) return null
  if (href.trim() === '') return null

  const clean = stripQueryHash(href)
  if (!clean) return null

  if (clean.startsWith('/')) {
    let local = clean
    if (basePath && local.startsWith(basePath + '/')) {
      local = local.slice(basePath.length)
    } else if (basePath && local === basePath) {
      local = '/'
    }
    return join(outDir, local)
  }

  return join(dirname(htmlFile), clean)
}

/**
 * Check whether a resolved path corresponds to an existing file.
 * Handles both trailing-slash (path/index.html) and flat (path.html) modes.
 */
function resolvedPathExists(resolved: string, trailingSlash: boolean): boolean {
  if (fileExists(resolved)) return true
  if (fileExists(join(resolved, 'index.html'))) return true
  if (!trailingSlash && !extname(resolved) && fileExists(`${resolved}.html`)) return true
  return false
}

/**
 * Validate that an SVG file is renderable — contains a valid <svg> root
 * and no parser error markers.
 */
function validateSvgContent(content: string, relPath: string): BuildValidationIssue[] {
  const issues: BuildValidationIssue[] = []

  if (!/<svg[\s>]/i.test(content)) {
    issues.push({
      file: relPath,
      message: 'SVG file does not contain an <svg> element',
      severity: 'error',
    })
    return issues
  }

  for (const pattern of SVG_ERROR_PATTERNS) {
    if (pattern.test(content)) {
      issues.push({
        file: relPath,
        message: `SVG file contains error marker: ${pattern.source}`,
        severity: 'error',
      })
    }
  }

  return issues
}

// ── Main validator ──

/**
 * Validate a static site build output directory.
 *
 * Checks internal links, image sources, asset hashes, and SVG validity.
 */
export function validateBuildOutput(options: BuildValidatorOptions): BuildValidationResult {
  const { outDir, basePath: rawBasePath, trailingSlash = false, exclude } = options

  const basePath = rawBasePath?.replace(/\/+$/, '') ?? ''
  const excludeDirs = new Set([...DEFAULT_EXCLUDE, ...(exclude ?? [])])

  const errors: BuildValidationIssue[] = []
  const warnings: BuildValidationIssue[] = []

  if (!existsSync(outDir)) {
    errors.push({
      file: outDir,
      message: 'Build output directory does not exist',
      severity: 'error',
    })
    return { errors, warnings, htmlFileCount: 0, imageFileCount: 0, passed: false }
  }

  // Collect HTML files
  const htmlPaths = walkFiles(outDir, '.html', excludeDirs)
  const htmlFiles = new Map<string, string>()
  for (const p of htmlPaths) {
    htmlFiles.set(p, readFileSync(p, 'utf-8'))
  }

  // Collect all image files
  const allFiles = walkFiles(outDir, undefined, excludeDirs)
  const imageFiles = allFiles.filter((f) => isImageFile(f))

  const assetsDir = join(outDir, 'assets')

  // 1. Check internal links and image sources
  for (const [htmlPath, content] of htmlFiles) {
    if (isRedirect(content)) continue
    const rel = relative(outDir, htmlPath)
    const stripped = stripCodeContent(content)

    // Extract href and src attributes
    const refPattern = /\b(href|src)=(["'])([^"']*)\2/gi
    let match: RegExpExecArray | null
    while ((match = refPattern.exec(stripped)) !== null) {
      const attr = match[1]!
      const ref = match[3]!

      if (ref === '...' || ref === '…' || ref === '') continue
      if (isExternal(ref)) continue

      const resolved = resolveLocalHref(ref, htmlPath, outDir, basePath, trailingSlash)
      if (!resolved) continue

      if (!resolvedPathExists(resolved, trailingSlash)) {
        const cleanRef = stripQueryHash(ref)
        const assetBasename = basename(cleanRef)
        if (existsSync(assetsDir) && fileExists(join(assetsDir, assetBasename))) {
          warnings.push({
            file: rel,
            message: `Asset path mismatch: ${ref} (exists in assets/ as ${assetBasename})`,
            severity: 'warn',
          })
        } else {
          errors.push({
            file: rel,
            message: `Broken ${attr}: ${ref}`,
            severity: 'error',
          })
        }
      }
    }

    // Extract srcset attributes
    const srcsetPattern = /\bsrcset=(["'])([^"']*)\1/gi
    while ((match = srcsetPattern.exec(stripped)) !== null) {
      const srcset = match[2]!
      for (const entry of srcset.split(',')) {
        const trimmed = entry.trim()
        if (!trimmed) continue
        const [ref] = trimmed.split(/\s+/)
        if (!ref || isExternal(ref)) continue

        const resolved = resolveLocalHref(ref, htmlPath, outDir, basePath, trailingSlash)
        if (!resolved) continue

        if (!resolvedPathExists(resolved, trailingSlash)) {
          errors.push({
            file: rel,
            message: `Broken srcset entry: ${ref}`,
            severity: 'error',
          })
        }
      }
    }
  }

  // 2. Check that all images under assets/ have content hashes
  if (existsSync(assetsDir)) {
    const assetImages = walkFiles(assetsDir).filter((f) => isImageFile(f))
    for (const imgPath of assetImages) {
      const fileName = basename(imgPath)
      if (!hasContentHash(fileName)) {
        errors.push({
          file: relative(outDir, imgPath),
          message: `Image in assets/ missing content hash: ${fileName}`,
          severity: 'error',
        })
      }
    }
  }

  // 3. Validate SVG files are renderable
  for (const imgPath of imageFiles) {
    if (extname(imgPath).toLowerCase() !== '.svg') continue
    const content = readFileSync(imgPath, 'utf-8')
    const rel = relative(outDir, imgPath)
    const svgIssues = validateSvgContent(content, rel)
    for (const issue of svgIssues) {
      if (issue.severity === 'error') {
        errors.push(issue)
      } else {
        warnings.push(issue)
      }
    }
  }

  return {
    errors,
    warnings,
    htmlFileCount: htmlFiles.size,
    imageFileCount: imageFiles.length,
    passed: errors.length === 0,
  }
}

/**
 * Run build validation and print results to console.
 * Returns the process exit code (0 = pass, 1 = fail).
 */
export function runBuildValidation(options: BuildValidatorOptions): number {
  const { outDir, basePath, trailingSlash, exclude } = options

  console.log(`Validating build output: ${outDir}`)
  if (basePath) console.log(`  basePath: ${basePath}`)
  console.log(`  trailingSlash: ${trailingSlash ?? false}`)
  const allExclude = [...DEFAULT_EXCLUDE, ...(exclude ?? [])]
  if (allExclude.length > 0) console.log(`  exclude: ${allExclude.join(', ')}`)

  const result = validateBuildOutput(options)

  console.log(`  HTML files: ${result.htmlFileCount}`)
  console.log(`  Image files: ${result.imageFileCount}`)

  if (result.warnings.length > 0) {
    console.log(`\n${result.warnings.length} warning(s):`)
    for (const w of result.warnings) {
      console.log(`  ⚠ ${w.file}: ${w.message}`)
    }
  }

  if (result.errors.length > 0) {
    console.log(`\n${result.errors.length} error(s):`)
    for (const e of result.errors) {
      console.log(`  ✗ ${e.file}: ${e.message}`)
    }
  }

  console.log(
    `\nBuild validation: ${result.errors.length} errors, ${result.warnings.length} warnings`,
  )

  return result.passed ? 0 : 1
}
