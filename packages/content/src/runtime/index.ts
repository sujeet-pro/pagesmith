/**
 * Runtime CSS/JS exports.
 *
 * Provides pre-built CSS and JS for consumers who want
 * ready-to-use styling and interactivity for rendered content.
 *
 * Two tiers:
 * - "Runtime" (standalone): full site — reset, prose, code, layout, theme toggle, TOC, copy-code
 * - "Content": just markdown rendering — reset, prose, code, diagrams, viewport, copy-code
 *
 * Individual CSS files are also available for fine-grained imports.
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const SOURCE_ASSET_PATHS: Record<string, string> = {
  'standalone.css': 'src/styles/standalone.css',
  'content.css': 'src/styles/content.css',
  'styles/diagrams.css': 'src/styles/diagrams.css',
  'styles/code/tabs.css': 'src/styles/code/tabs.css',
  'styles/viewport.css': 'src/styles/viewport.css',
}

function getCorePackageDir(): string {
  // Resolve @pagesmith/core's location from our dependency
  try {
    const corePath = import.meta.resolve?.('@pagesmith/core')
    if (corePath) {
      const resolved = corePath.startsWith('file://') ? fileURLToPath(corePath) : corePath
      // Navigate up from the resolved entry to the package root
      // Typical: packages/core/dist/index.js -> packages/core/
      // Or: packages/core/src/index.ts -> packages/core/
      return join(dirname(resolved), '..')
    }
  } catch {}

  // Fallback: relative path from our location
  const thisDir = dirname(fileURLToPath(import.meta.url))
  return join(thisDir, '..', '..', '..', 'core')
}

function readAsset(relPath: string): string {
  const pkgDir = getCorePackageDir()
  const sourcePath = SOURCE_ASSET_PATHS[relPath]
  if (sourcePath) {
    try {
      return readFileSync(join(pkgDir, sourcePath), 'utf-8')
    } catch {}
  }

  // Try dist/ first (built package), then src/ (development)
  for (const dir of ['dist', 'src']) {
    try {
      return readFileSync(join(pkgDir, dir, relPath), 'utf-8')
    } catch {}
  }
  return ''
}

function resolveAssetPath(relPath: string): string {
  const pkgDir = getCorePackageDir()
  const sourcePath = SOURCE_ASSET_PATHS[relPath]
  if (sourcePath) {
    const path = join(pkgDir, sourcePath)
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

// ─── Standalone (full site) ───────────────────────────────────

/** Get the bundled standalone CSS (reset + prose + code + layout + theme toggle). */
export function getRuntimeCSS(): string {
  return readAsset('standalone.css')
}

/** Get the bundled standalone JS (theme + TOC highlight + copy-code). */
export function getRuntimeJS(): string {
  return readAsset('standalone.js')
}

/** Get the absolute file path to the standalone CSS file. */
export function getRuntimeCSSPath(): string {
  return resolveAssetPath('standalone.css')
}

/** Get the absolute file path to the standalone JS file. */
export function getRuntimeJSPath(): string {
  return resolveAssetPath('standalone.js')
}

// ─── Content (markdown rendering only) ────────────────────────

/** Get the content CSS (reset + prose + code + diagrams + viewport). */
export function getContentCSS(): string {
  return readAsset('content.css')
}

/** Get the content JS (copy-code only — no theme or TOC). */
export function getContentJS(): string {
  return readAsset('content.js')
}

/** Get the absolute file path to the content CSS file. */
export function getContentCSSPath(): string {
  return resolveAssetPath('content.css')
}

/** Get the absolute file path to the content JS file. */
export function getContentJSPath(): string {
  return resolveAssetPath('content.js')
}

// ─── Individual CSS files ─────────────────────────────────────

/** Get the diagrams CSS (light/dark image switching). */
export function getDiagramsCSS(): string {
  return readAsset('styles/diagrams.css')
}

/** Get the absolute file path to the diagrams CSS file. */
export function getDiagramsCSSPath(): string {
  return resolveAssetPath('styles/diagrams.css')
}

/** Get the code tabs CSS (CSS-only tab switching). */
export function getTabsCSS(): string {
  return readAsset('styles/code/tabs.css')
}

/** Get the absolute file path to the code tabs CSS file. */
export function getTabsCSSPath(): string {
  return resolveAssetPath('styles/code/tabs.css')
}

/** Get the viewport CSS (overflow prevention for prose content). */
export function getViewportCSS(): string {
  return readAsset('styles/viewport.css')
}

/** Get the absolute file path to the viewport CSS file. */
export function getViewportCSSPath(): string {
  return resolveAssetPath('styles/viewport.css')
}
