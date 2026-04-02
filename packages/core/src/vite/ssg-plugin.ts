/**
 * Vite plugin for static site generation with @pagesmith/core.
 *
 * Handles both development (on-the-fly SSR via middleware) and
 * production (post-build SSG + pagefind indexing).
 *
 * The SSR entry module must export:
 * - `getRoutes(config)` — returns route paths to pre-render
 * - `render(url, config)` — renders a route to an HTML string
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { pagesmithSsg } from '@pagesmith/core/vite'
 *
 * export default defineConfig({
 *   base: '/my-site/',
 *   plugins: [pagesmithSsg({ entry: './src/entry-server.tsx' })],
 * })
 * ```
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
import { dirname, extname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { copyPublicFiles } from '../assets'

export type SsgPluginOptions = {
  /** Path to the SSR entry module (e.g., './src/entry-server.tsx') */
  entry: string
  /** Run pagefind after build (default: true) */
  pagefind?: boolean
  /** Content roots used for copying companion assets. */
  contentDirs?: string[]
}

export type SsgRenderConfig = {
  /** Base path without trailing slash (e.g., '/my-site') */
  base: string
  /** Absolute path to the project root */
  root: string
  /** Path to the built CSS asset */
  cssPath: string
  /** Path to the built JS asset (undefined in dev for inline-script examples) */
  jsPath?: string
  /** Whether search is enabled (false in dev) */
  searchEnabled: boolean
  /** Whether running in dev mode */
  isDev: boolean
}

const MIME: Record<string, string> = {
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

const WS_RELOAD_SCRIPT = `<script type="module">
import 'vite/modulepreload-polyfill'
if (import.meta.hot) {
  import.meta.hot.on('full-reload', () => location.reload())
}
</script>`

const CONTENT_ASSET_EXTS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
])

function resolveContentDirs(projectRoot: string, contentDirs: string[] = []): string[] {
  return contentDirs.map((dir) => resolve(projectRoot, dir))
}

function isAssetReference(ref: string): boolean {
  if (!ref.startsWith('./')) return false
  const path = ref.split(/[?#]/u, 1)[0] ?? ref
  return CONTENT_ASSET_EXTS.has(extname(path).toLowerCase())
}

function rewriteContentAssetRefs(html: string, base: string): string {
  const basePrefix = base.replace(/\/+$/u, '')

  return html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr: string, ref: string) => {
    if (!isAssetReference(ref)) return match
    const pathname = ref.split(/[?#]/u, 1)[0] ?? ref
    const suffix = ref.slice(pathname.length)
    return `${attr}="${basePrefix}/assets/${pathname.split('/').pop() ?? pathname}${suffix}"`
  })
}

function collectContentAssets(contentDirs: string[]): Map<string, string> {
  const assets = new Map<string, string>()

  function walk(dir: string): void {
    if (!existsSync(dir)) return

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue

      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      const ext = extname(entry.name).toLowerCase()
      if (!CONTENT_ASSET_EXTS.has(ext)) continue

      if (assets.has(entry.name) && assets.get(entry.name) !== fullPath) {
        console.warn(
          `pagesmith:ssg duplicate companion asset basename "${entry.name}" detected; using ${fullPath}`,
        )
      }

      assets.set(entry.name, fullPath)
    }
  }

  for (const dir of contentDirs) {
    walk(dir)
  }

  return assets
}

function copyContentAssetsToOutDir(outDir: string, assets: Map<string, string>): void {
  if (assets.size === 0) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  for (const [fileName, sourcePath] of assets) {
    copyFileSync(sourcePath, join(assetsDir, fileName))
  }
}

export function pagesmithSsg(options: SsgPluginOptions): Plugin[] {
  const enablePagefind = options.pagefind !== false
  let config: ResolvedConfig
  let projectRoot: string
  let base: string // e.g., '/my-site'
  let outDir: string
  let contentDirs: string[] = []
  let contentAssets = new Map<string, string>()

  // ── Dev plugin: SSR middleware ──
  const devPlugin: Plugin = {
    name: 'pagesmith:ssg-dev',
    apply: 'serve',

    config() {
      // Disable Vite's built-in SPA HTML serving so the SSG middleware
      // can handle all HTML requests via server-side rendering.
      return { appType: 'custom' }
    },

    configResolved(resolved) {
      config = resolved
      projectRoot = resolved.root
      base = resolved.base.replace(/\/+$/, '')
      outDir = resolve(projectRoot, resolved.build.outDir)
      contentDirs = resolveContentDirs(projectRoot, options.contentDirs)
    },

    configureServer(server: ViteDevServer) {
      async function refreshContentArtifacts(): Promise<void> {
        contentAssets = collectContentAssets(contentDirs)
      }

      void refreshContentArtifacts().catch((error) => {
        console.warn(
          `pagesmith:ssg failed to prepare companion assets: ${error instanceof Error ? error.message : String(error)}`,
        )
      })

      if (contentDirs.length > 0) {
        server.watcher.add(contentDirs)

        const refresh = () => {
          void refreshContentArtifacts().catch((error) => {
            console.warn(
              `pagesmith:ssg failed to refresh companion assets: ${error instanceof Error ? error.message : String(error)}`,
            )
          })
        }

        server.watcher.on('add', refresh)
        server.watcher.on('change', refresh)
        server.watcher.on('unlink', refresh)
      }

      // Register middleware directly — appType: 'custom' disables Vite's
      // built-in HTML serving, so we handle all HTML requests via SSR.
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/'
        const pathname = url.split(/[?#]/u, 1)[0] ?? url

        if (pathname.includes('/assets/')) {
          const assetName = pathname.split('/assets/').pop()
          const assetPath = assetName ? contentAssets.get(assetName) : undefined

          if (assetPath) {
            const ext = extname(assetPath).toLowerCase()
            res.writeHead(200, {
              'Content-Type': MIME[ext] ?? 'application/octet-stream',
              'Cache-Control': 'no-cache',
            })
            res.end(readFileSync(assetPath))
            return
          }
        }

        // Only handle HTML navigation requests (not assets)
        const accept = req.headers.accept ?? ''
        if (!accept.includes('text/html')) return next()

        // Redirect root to base
        if (base && (url === '/' || url === '')) {
          res.writeHead(302, { Location: `${base}/` })
          res.end()
          return
        }

        // Must start with base path
        if (base && !url.startsWith(base)) return next()

        try {
          // Load SSR module on-the-fly (Vite transforms TSX etc.)
          const ssrMod = await server.ssrLoadModule(resolve(projectRoot, options.entry))
          const renderFn: (url: string, cfg: SsgRenderConfig) => Promise<string> | string =
            ssrMod.render

          if (typeof renderFn !== 'function') {
            return next()
          }

          const renderConfig: SsgRenderConfig = {
            base,
            root: projectRoot,
            cssPath: `${base}/src/theme.css`, // Vite transforms this in dev
            jsPath: undefined,
            searchEnabled: false,
            isDev: true,
          }

          let html = await renderFn(url, renderConfig)
          html = rewriteContentAssetRefs(html, base)

          // Inject Vite's client + HMR script for live reload
          html = html.replace(
            '</head>',
            `<script type="module" src="/@vite/client"></script>\n` +
              `<link rel="stylesheet" href="${base}/src/theme.css">\n` +
              `</head>`,
          )

          // Let Vite transform the HTML (resolves module URLs, etc.)
          html = await server.transformIndexHtml(url, html)

          const status = html.includes('doc-not-found') ? 404 : 200
          res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(html)
        } catch (err: any) {
          server.ssrFixStacktrace(err)
          console.error(`SSR error for ${url}:`, err.message)
          next(err)
        }
      })
    },
  }

  // ── Build plugin: SSG post-build ──
  const buildPlugin: Plugin = {
    name: 'pagesmith:ssg-build',
    apply: 'build',

    configResolved(resolved) {
      config = resolved
      projectRoot = resolved.root
      base = resolved.base.replace(/\/+$/, '')
      outDir = resolve(projectRoot, resolved.build.outDir)
      contentDirs = resolveContentDirs(projectRoot, options.contentDirs)
    },

    async closeBundle() {
      // Skip SSG during the SSR build itself (detected by ssr option)
      if (config.build.ssr) return

      console.log('\nSSG: Starting static site generation...')

      contentAssets = collectContentAssets(contentDirs)

      // Copy font assets from @pagesmith/core
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

      // Copy public/ files (favicon etc.)
      const publicDir = join(projectRoot, 'public')
      copyPublicFiles(publicDir, outDir)

      // Discover built asset paths from the client build output
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

      // SSR build — use child process to avoid nested Vite resolution issues
      console.log('SSG: Building SSR bundle...')
      const { execFileSync } = await import('child_process')
      const serverDir = join(outDir, '.server')
      const ssrEntry = resolve(projectRoot, options.entry)
      // Write a temp build script that externalizes node_modules and skips the SSG plugin
      const buildScript = `
        import { build } from 'vite-plus';
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

      // Load SSR module
      const serverEntry = join(serverDir, 'entry-server.js')
      const ssrMod = await import(pathToFileURL(serverEntry).href)

      const renderConfig: SsgRenderConfig = {
        base,
        root: projectRoot,
        cssPath,
        jsPath,
        searchEnabled: true,
        isDev: false,
      }

      // Get routes and render
      const routes: string[] = await ssrMod.getRoutes(renderConfig)
      console.log(`SSG: Rendering ${routes.length} pages...`)

      for (const route of routes) {
        const html = rewriteContentAssetRefs(await ssrMod.render(route, renderConfig), base)
        const routePath = route === '/' ? '' : route.replace(/^\//, '')
        const outputPath = join(outDir, routePath, 'index.html')
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `<!DOCTYPE html>\n${html}`)

        if (route === '/404') {
          writeFileSync(join(outDir, '404.html'), `<!DOCTYPE html>\n${html}`)
        }
      }

      copyContentAssetsToOutDir(outDir, contentAssets)

      // Cleanup SSR build
      rmSync(serverDir, { recursive: true, force: true })

      // Run pagefind
      if (enablePagefind) {
        console.log('SSG: Indexing with Pagefind...')
        try {
          const pagefindMain = fileURLToPath(import.meta.resolve('pagefind'))
          const pagefindBin = join(dirname(pagefindMain), '..', 'lib', 'runner', 'bin.cjs')
          const { execFileSync } = await import('child_process')
          execFileSync(process.execPath, [pagefindBin, '--site', outDir], { stdio: 'inherit' })
        } catch {
          console.warn('SSG: Pagefind not found, skipping search indexing')
        }
      }

      console.log(`SSG: Done — ${routes.length} pages generated`)
    },
  }

  return [devPlugin, buildPlugin]
}
