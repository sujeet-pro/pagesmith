/**
 * Runtime CSS/JS exports.
 *
 * Provides pre-built CSS and JS paths for consumers who want
 * ready-to-use styling and interactivity for rendered content.
 *
 * Two tiers:
 * - "Runtime" (standalone): full site — reset, prose, layout, TOC
 * - "Content": just markdown rendering — reset, prose, viewport
 *
 * Code block styling is handled by Expressive Code (injected inline
 * during markdown processing). The CSS bundles here cover prose,
 * inline code, and layout only.
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ASSET_PATHS: Record<string, string> = {
  'standalone.css': 'styles/standalone.css',
  'content.css': 'styles/content.css',
  'styles/viewport.css': 'styles/viewport.css',
}

function getPackageDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url))
  // From src/runtime/ → src/ → package root
  // From dist/runtime/ → dist/ → package root
  return join(thisDir, '..', '..')
}

function readAsset(relPath: string): string {
  const pkgDir = getPackageDir()
  const mapped = ASSET_PATHS[relPath]
  if (mapped) {
    try {
      return readFileSync(join(pkgDir, 'src', mapped), 'utf-8')
    } catch {}
  }
  for (const dir of ['dist', 'src']) {
    try {
      return readFileSync(join(pkgDir, dir, relPath), 'utf-8')
    } catch {}
  }
  return ''
}

function resolveAssetPath(relPath: string): string {
  const pkgDir = getPackageDir()
  const mapped = ASSET_PATHS[relPath]
  if (mapped) {
    const path = join(pkgDir, 'src', mapped)
    try {
      readFileSync(path)
      return path
    } catch {}
  }
  for (const dir of ['dist', 'src']) {
    const path = join(pkgDir, dir, relPath)
    try {
      readFileSync(path)
      return path
    } catch {}
  }
  return join(pkgDir, 'dist', relPath)
}

// Standalone (full site)
export function getRuntimeCSS(): string {
  return readAsset('standalone.css')
}
export function getRuntimeJS(): string {
  return readAsset('standalone.js')
}
export function getRuntimeCSSPath(): string {
  return resolveAssetPath('standalone.css')
}
export function getRuntimeJSPath(): string {
  return resolveAssetPath('standalone.js')
}

// Content (markdown rendering only)
export function getContentCSS(): string {
  return readAsset('content.css')
}
export function getContentJS(): string {
  return readAsset('content.js')
}
export function getContentCSSPath(): string {
  return resolveAssetPath('content.css')
}
export function getContentJSPath(): string {
  return resolveAssetPath('content.js')
}

// Individual CSS files
export function getViewportCSS(): string {
  return readAsset('styles/viewport.css')
}
export function getViewportCSSPath(): string {
  return resolveAssetPath('styles/viewport.css')
}
