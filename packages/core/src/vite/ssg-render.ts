/**
 * Route collection, pre-rendering, and content asset handling for the SSG plugin.
 *
 * Provides:
 * - Content companion asset discovery and copying
 * - HTML asset reference rewriting
 * - SSR bundle building via child process
 * - Route pre-rendering to static HTML files
 * - Font and public file copying
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { basename, dirname, extname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { ResolvedConfig } from 'vite'
import { collectContentAssets, CONTENT_ASSET_EXTS, copyPublicFiles } from '../assets'
import type { SsgRenderConfig } from './ssg-plugin'

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

// ── Content directory helpers ──

export function resolveContentDirs(projectRoot: string, contentDirs: string[] = []): string[] {
  return contentDirs.map((dir) => resolve(projectRoot, dir))
}

function isAssetReference(ref: string): boolean {
  if (!ref.startsWith('./')) return false
  const path = ref.split(/[?#]/u, 1)[0] ?? ref
  return CONTENT_ASSET_EXTS.has(extname(path).toLowerCase())
}

export function rewriteContentAssetRefs(html: string, base: string): string {
  const basePrefix = base.replace(/\/+$/u, '')

  return html.replace(
    /(src|href|srcset)=(?:"([^"]+)"|'([^']+)')/g,
    (match, attr: string, doubleRef: string | undefined, singleRef: string | undefined) => {
      const ref = doubleRef ?? singleRef ?? ''
      if (!isAssetReference(ref)) return match
      const pathname = ref.split(/[?#]/u, 1)[0] ?? ref
      const suffix = ref.slice(pathname.length)
      const quote = doubleRef !== undefined ? '"' : "'"
      return `${attr}=${quote}${basePrefix}/assets/${pathname.split('/').pop() ?? pathname}${suffix}${quote}`
    },
  )
}

function copyContentAssetsToOutDir(outDir: string, assets: Map<string, string>): void {
  if (assets.size === 0) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  for (const [fileName, sourcePath] of assets) {
    copyFileSync(sourcePath, join(assetsDir, fileName))
  }
}

// ── Build-time rendering ──

export type SsgBuildContext = {
  /** Vite resolved config */
  config: ResolvedConfig
  /** Absolute path to the project root */
  projectRoot: string
  /** Base path without trailing slash (e.g., '/my-site') */
  base: string
  /** Absolute path to the build output directory */
  outDir: string
  /** Resolved content directories (absolute paths) */
  contentDirs: string[]
  /** Path to the SSR entry module */
  entry: string
}

/**
 * Run the full SSG build: SSR bundle, route pre-rendering, asset copying.
 *
 * Returns the number of pages rendered.
 */
export async function renderStaticSite(context: SsgBuildContext): Promise<number> {
  const { config, projectRoot, base, outDir, contentDirs, entry } = context

  console.log('\nSSG: Starting static site generation...')

  const contentAssets = collectContentAssets(contentDirs)

  // Copy font assets from @pagesmith/core
  copyFontAssets(outDir)

  // Copy public/ files (favicon etc.)
  const publicDir = join(projectRoot, 'public')
  copyPublicFiles(publicDir, outDir)

  // Discover built asset paths from the client build output
  const { cssPath, jsPath } = discoverBuiltAssets(outDir, base)

  // SSR build — use child process to avoid nested Vite resolution issues
  console.log('SSG: Building SSR bundle...')
  await buildSsrBundle(config, projectRoot, outDir, entry)

  // Load SSR module — derive output filename from the configured entry path
  const entryBaseName = basename(entry).replace(/\.(c|m)?[jt]sx?$/u, '.js')
  const serverDir = join(outDir, '.server')
  const serverEntry = join(serverDir, entryBaseName)
  const ssrMod = await import(pathToFileURL(serverEntry).href)

  const renderConfig: SsgRenderConfig = {
    base,
    root: projectRoot,
    cssPath,
    jsPath,
    searchEnabled: true,
    isDev: false,
  }

  // Get routes and render with bounded concurrency
  const routes: string[] = await ssrMod.getRoutes(renderConfig)
  console.log(`SSG: Rendering ${routes.length} pages...`)

  const concurrency = Math.min(routes.length, 8)
  let routeIndex = 0

  async function renderWorker(): Promise<void> {
    while (routeIndex < routes.length) {
      const i = routeIndex++
      const route = routes[i]
      const html = rewriteContentAssetRefs(await ssrMod.render(route, renderConfig), base)
      const routePath = route === '/' ? '' : route.replace(/^\//, '')
      const outputPath = join(outDir, routePath, 'index.html')
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, `<!DOCTYPE html>\n${html}`)

      if (route === '/404') {
        writeFileSync(join(outDir, '404.html'), `<!DOCTYPE html>\n${html}`)
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => renderWorker())
  await Promise.all(workers)

  copyContentAssetsToOutDir(outDir, contentAssets)

  // Cleanup SSR build
  rmSync(serverDir, { recursive: true, force: true })

  return routes.length
}

function copyFontAssets(outDir: string): void {
  const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
  const coreFontsDir = join(corePkgDir, 'assets', 'fonts')
  const outFontsDir = join(outDir, 'assets', 'fonts')
  mkdirSync(outFontsDir, { recursive: true })
  for (const file of readdirSync(coreFontsDir)) {
    if (file.endsWith('.woff2')) {
      copyFileSync(join(coreFontsDir, file), join(outFontsDir, file))
    }
  }
  copyFileSync(join(corePkgDir, 'assets', 'fonts.css'), join(outDir, 'assets', 'fonts.css'))
}

function discoverBuiltAssets(
  outDir: string,
  base: string,
): { cssPath: string; jsPath: string | undefined } {
  const builtIndex = join(outDir, 'index.html')
  let cssPath = `${base}/assets/style.css`
  let jsPath: string | undefined
  if (existsSync(builtIndex)) {
    const html = readFileSync(builtIndex, 'utf-8')
    const cssMatch = html.match(/href="([^"]*\.css)"/)
    const jsMatch = html.match(/src="([^"]*\.js)"/)
    if (cssMatch) cssPath = cssMatch[1]
    if (jsMatch) jsPath = jsMatch[1]
  }
  return { cssPath, jsPath }
}

async function buildSsrBundle(
  config: ResolvedConfig,
  projectRoot: string,
  outDir: string,
  entry: string,
): Promise<void> {
  const { execFileSync } = await import('child_process')
  const serverDir = join(outDir, '.server')
  const ssrEntry = resolve(projectRoot, entry)
  // Write a temp build script that externalizes node_modules and skips the SSG plugin
  const buildScript = `
    import { build } from 'vite';
    await build({
      root: ${JSON.stringify(projectRoot)},
      logLevel: 'warn',
      mode: ${JSON.stringify(config.mode)},
      build: {
        ssr: ${JSON.stringify(ssrEntry)},
        outDir: ${JSON.stringify(serverDir)},
        emptyOutDir: true,
      },
    });
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', buildScript], {
    stdio: 'inherit',
    cwd: projectRoot,
  })
}
