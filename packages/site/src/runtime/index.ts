/**
 * Runtime CSS/JS exports.
 *
 * Provides pre-built CSS and JS paths for consumers who want
 * ready-to-use styling and interactivity for rendered content.
 *
 * Three tiers:
 * - "Standalone": full site — chrome, prose, code blocks
 * - "Chrome": shared site chrome — header/sidebar/footer/TOC/theme
 * - "Content": markdown rendering only — prose, code blocks
 *
 * Code block styling is included in the shipped CSS bundles. Load
 * `@pagesmith/site/runtime/content` (or the JS returned here) to
 * enable tabs, copy buttons, and collapsed code ranges.
 */

import { existsSync, readFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ASSET_PATHS: Record<string, string> = {
  'chrome.css': 'styles/chrome.css',
  'standalone.css': 'styles/standalone.css',
  'content.css': 'styles/content.css',
  'styles/viewport.css': 'styles/viewport.css',
}

const require = createRequire(import.meta.url)

function getPackageDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url))
  // From src/runtime/ → src/ → package root
  // From dist/runtime/ → dist/ → package root
  return join(thisDir, '..', '..')
}

function readAsset(relPath: string): string {
  const pkgDir = getPackageDir()
  const mapped = ASSET_PATHS[relPath]
  const candidates = [
    ...(mapped ? [join(pkgDir, 'src', mapped)] : []),
    join(pkgDir, 'dist', relPath),
    join(pkgDir, 'src', relPath),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, 'utf-8')
    }
  }

  throw new Error(`[pagesmith] Asset not found: ${relPath}`)
}

function stripSourceMapComment(source: string): string {
  return source.replace(/^\s*\/\/# sourceMappingURL=.*$/gm, '').trim()
}

function readModuleSource(relPath: string): string {
  const pkgDir = getPackageDir()
  const distPath = join(pkgDir, 'dist', `${relPath}.mjs`)
  if (existsSync(distPath)) {
    return stripSourceMapComment(readFileSync(distPath, 'utf-8'))
  }

  const srcPath = join(pkgDir, 'src', `${relPath}.ts`)
  if (!existsSync(srcPath)) {
    throw new Error(`[pagesmith] Runtime module not found: ${relPath}`)
  }

  try {
    const ts = require('typescript') as typeof import('typescript')
    return stripSourceMapComment(
      ts.transpileModule(readFileSync(srcPath, 'utf-8'), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: srcPath,
        reportDiagnostics: false,
      }).outputText,
    )
  } catch (error) {
    throw new Error(
      `[pagesmith] Runtime module not built and typescript is unavailable: ${relPath}`,
      { cause: error },
    )
  }
}

function concatModuleSources(relPaths: string[], initStatements: string[]): string {
  const chunks = relPaths.map((relPath) => readModuleSource(relPath))
  return `${chunks.join('\n\n')}\n\n${initStatements.join('\n')}\n`
}

function resolveAssetPath(relPath: string): string {
  const pkgDir = getPackageDir()
  const mapped = ASSET_PATHS[relPath]
  if (mapped) {
    const path = join(pkgDir, 'src', mapped)
    if (existsSync(path)) return path
  }
  for (const dir of ['dist', 'src']) {
    const path = join(pkgDir, dir, relPath)
    if (existsSync(path)) return path
  }
  return join(pkgDir, 'dist', relPath)
}

// Chrome (shared reusable site components)
export function getChromeCSS(): string {
  return readAsset('chrome.css')
}
export function getChromeJS(): string {
  return concatModuleSources(
    [
      'runtime/footer-year',
      'runtime/search-trigger',
      'runtime/sidebar',
      'runtime/skip-link',
      'runtime/theme',
      'runtime/themed-images',
      'runtime/toc-highlight',
    ],
    [
      'initFooterCopyrightYear()',
      'initSearchTriggerDensity()',
      'initSidebarModal()',
      'initSkipLinkFocus()',
      'initTheme()',
      'initThemedImages()',
      'initTocHighlight()',
    ],
  )
}
export function getChromeCSSPath(): string {
  return resolveAssetPath('chrome.css')
}
export function getChromeJSPath(): string {
  return resolveAssetPath('runtime/chrome.mjs')
}

// Standalone (full site)
export function getRuntimeCSS(): string {
  return readAsset('standalone.css')
}
export function getRuntimeJS(): string {
  return concatModuleSources(
    [
      'runtime/footer-year',
      'runtime/search-trigger',
      'runtime/sidebar',
      'runtime/skip-link',
      'runtime/theme',
      'runtime/themed-images',
      'runtime/toc-highlight',
      'runtime/code-blocks',
      'runtime/code-tabs',
    ],
    [
      'initFooterCopyrightYear()',
      'initSearchTriggerDensity()',
      'initSidebarModal()',
      'initSkipLinkFocus()',
      'initTheme()',
      'initThemedImages()',
      'initTocHighlight()',
      'initCodeBlocks()',
      'initCodeTabs()',
    ],
  )
}
export function getRuntimeCSSPath(): string {
  return resolveAssetPath('standalone.css')
}
export function getRuntimeJSPath(): string {
  return resolveAssetPath('runtime/standalone.mjs')
}

// Content (markdown rendering only)
export function getContentCSS(): string {
  return readAsset('content.css')
}
export function getContentJS(): string {
  return concatModuleSources(
    ['runtime/code-blocks', 'runtime/code-tabs', 'runtime/themed-images'],
    ['initCodeBlocks()', 'initCodeTabs()', 'initThemedImages()'],
  )
}
export function getContentCSSPath(): string {
  return resolveAssetPath('content.css')
}
export function getContentJSPath(): string {
  return resolveAssetPath('runtime/content.mjs')
}

// Individual CSS files
export function getViewportCSS(): string {
  return readAsset('styles/viewport.css')
}
export function getViewportCSSPath(): string {
  return resolveAssetPath('styles/viewport.css')
}
