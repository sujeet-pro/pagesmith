/**
 * Dev-server middleware for the SSG plugin.
 *
 * Handles on-the-fly SSR rendering during development, including:
 * - Content companion asset serving from content directories
 * - HTML navigation request handling via server-side rendering
 * - Vite HMR client injection for live reload
 */

import { extname, join, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import type { ViteDevServer } from 'vite'
import type { SsgRenderConfig } from './ssg-plugin'
import {
  type ContentAssetMap,
  collectContentAssets,
  renderGeneratedImageVariant,
  resolveGeneratedImageSourcePath,
} from '../assets/index.js'
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
  /** CSS entry path relative to project root (e.g., './styles/main.css') */
  cssEntry: string
}

/**
 * Discover the client JS entry path from the project's index.html.
 * Returns the Vite-served path (with base prefix) or undefined.
 */
function discoverDevClientEntry(projectRoot: string, base: string): string | undefined {
  const indexPath = join(projectRoot, 'index.html')
  if (!existsSync(indexPath)) return undefined
  const html = readFileSync(indexPath, 'utf-8')
  const match = html.match(/<script[^>]*\bsrc=(["'])([^"']+)\1/i)
  if (!match) return undefined
  const src = match[2]
  if (src.startsWith('http')) return src
  const normalized = src.startsWith('/') ? src : `/${src.replace(/^\.\//, '')}`
  return `${base}${normalized}`
}

function decodeUrlPath(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function extractAssetRelPath(pathname: string): string | undefined {
  const assetsMarkerIndex = pathname.indexOf('/assets/')
  if (assetsMarkerIndex === -1) return undefined
  return decodeUrlPath(pathname.slice(assetsMarkerIndex + '/assets/'.length))
}

export function extractRoutePath(requestUrl: string, base: string): string {
  const pathname = requestUrl.split(/[?#]/u, 1)[0] ?? requestUrl
  if (base && pathname.startsWith(base)) {
    return decodeUrlPath(pathname.slice(base.length).replace(/^\//, ''))
  }
  return decodeUrlPath(pathname.replace(/^\//, ''))
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
  const { projectRoot, base, contentDirs, entry, cssEntry } = context
  let contentAssets: ContentAssetMap = collectContentAssets(contentDirs)

  async function refreshContentArtifacts(): Promise<void> {
    contentAssets = collectContentAssets(contentDirs)
  }

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

  const cssDevPath = `${base}/${cssEntry.replace(/^\.\//, '')}`
  const jsPath = discoverDevClientEntry(projectRoot, base)

  // Register middleware directly — appType: 'custom' disables Vite's
  // built-in HTML serving, so we handle all HTML requests via SSR.
  server.middlewares.use(async (req, res, next) => {
    const url = req.url ?? '/'
    const pathname = url.split(/[?#]/u, 1)[0] ?? url

    if (pathname.includes('/assets/')) {
      const assetRelPath = extractAssetRelPath(pathname)
      if (assetRelPath) {
        // Try by relative path first (directory-preserving), then by basename
        let assetPath = contentAssets.byPath.get(assetRelPath)
        if (!assetPath) {
          const name = assetRelPath.split('/').pop()
          const candidates = name ? contentAssets.byBasename.get(name) : undefined
          if (candidates?.length === 1) {
            assetPath = contentAssets.byPath.get(candidates[0])
          }
        }

        if (assetPath) {
          const ext = extname(assetPath).toLowerCase()
          res.writeHead(200, {
            'Content-Type': MIME[ext] ?? 'application/octet-stream',
            'Cache-Control': 'no-cache',
          })
          res.end(readFileSync(assetPath))
          return
        }

        const generatedSourcePath = resolveGeneratedImageSourcePath(assetRelPath, contentAssets)
        if (generatedSourcePath) {
          try {
            const ext = extname(assetRelPath).toLowerCase()
            res.writeHead(200, {
              'Content-Type': MIME[ext] ?? 'application/octet-stream',
              'Cache-Control': 'no-cache',
            })
            res.end(
              await renderGeneratedImageVariant(
                generatedSourcePath,
                ext === '.avif' ? 'avif' : 'webp',
              ),
            )
            return
          } catch (error) {
            console.warn(
              `pagesmith:ssg failed to render generated image variant ${assetRelPath}: ${error instanceof Error ? error.message : String(error)}`,
            )
          }
        }
      }

      return next()
    }

    // Only handle HTML navigation requests (not assets, not files with extensions)
    const accept = req.headers.accept ?? ''
    const pathExt = extname(pathname)
    if (pathExt && pathExt !== '.html') return next()
    if (!pathExt && !accept.includes('text/html')) return next()

    // Redirect root to base
    if (base && (pathname === '/' || pathname === '')) {
      res.writeHead(302, { Location: `${base}/` })
      res.end()
      return
    }

    // Must start with base path
    if (base && !pathname.startsWith(base)) return next()

    try {
      // Load SSR module on-the-fly (Vite transforms TSX etc.)
      const ssrMod = await server.ssrLoadModule(resolve(projectRoot, entry))
      const renderFn: (url: string, cfg: SsgRenderConfig) => Promise<string> | string =
        ssrMod.render

      if (typeof renderFn !== 'function') {
        return next()
      }

      const routePath = extractRoutePath(url, base)

      const renderConfig: SsgRenderConfig = {
        base,
        root: projectRoot,
        cssPath: cssDevPath,
        jsPath,
        searchEnabled: false,
        isDev: true,
      }

      let html = await renderFn(url, renderConfig)
      html = rewriteContentAssetRefs(html, base, contentAssets, routePath)

      // Inject the built CSS entry; Vite's HTML transform injects the dev client.
      html = html.replace('</head>', `<link rel="stylesheet" href="${cssDevPath}">\n</head>`)

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
