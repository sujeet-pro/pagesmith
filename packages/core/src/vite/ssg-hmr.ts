/**
 * Dev-server middleware for the SSG plugin.
 *
 * Handles on-the-fly SSR rendering during development, including:
 * - Content companion asset serving from content directories
 * - HTML navigation request handling via server-side rendering
 * - Vite HMR client injection for live reload
 */

import { extname, resolve } from 'path'
import { readFileSync } from 'fs'
import type { ViteDevServer } from 'vite'
import type { SsgRenderConfig } from './ssg-plugin'
import { collectContentAssets } from '../assets'
import { MIME, rewriteContentAssetRefs } from './ssg-render'

export type SsgDevContext = {
  /** Absolute path to the project root */
  projectRoot: string
  /** Base path without trailing slash (e.g., '/my-site') */
  base: string
  /** Resolved content directories (absolute paths) */
  contentDirs: string[]
  /** Path to the SSR entry module */
  entry: string
}

/**
 * Configure the Vite dev server with SSR middleware for on-the-fly rendering.
 *
 * Sets up:
 * - File watcher for content companion assets
 * - Middleware for serving companion assets from `/assets/` paths
 * - Middleware for SSR-rendering HTML navigation requests
 */
export function configureSsgDevServer(server: ViteDevServer, context: SsgDevContext): void {
  const { projectRoot, base, contentDirs, entry } = context
  let contentAssets = new Map<string, string>()

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

    // Only handle HTML navigation requests (not assets, not files with extensions)
    const accept = req.headers.accept ?? ''
    const pathExt = extname(pathname)
    if (pathExt && pathExt !== '.html') return next()
    if (!pathExt && !accept.includes('text/html')) return next()

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
      const ssrMod = await server.ssrLoadModule(resolve(projectRoot, entry))
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        server.ssrFixStacktrace(err)
      }
      console.error(`SSR error for ${url}:`, err instanceof Error ? err.message : String(err))
      next(err)
    }
  })
}
