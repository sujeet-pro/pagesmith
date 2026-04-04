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

import { resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import { configureSsgDevServer } from './ssg-hmr'
import { resolveContentDirs, renderStaticSite } from './ssg-render'
import { runPagefindIndexing } from './ssg-pagefind'

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

export function pagesmithSsg(options: SsgPluginOptions): Plugin[] {
  const enablePagefind = options.pagefind !== false
  let config: ResolvedConfig
  let projectRoot: string
  let base: string // e.g., '/my-site'
  let outDir: string
  let contentDirs: string[] = []

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

    configureServer(server) {
      configureSsgDevServer(server, {
        projectRoot,
        base,
        contentDirs,
        entry: options.entry,
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

      const pageCount = await renderStaticSite({
        config,
        projectRoot,
        base,
        outDir,
        contentDirs,
        entry: options.entry,
      })

      if (enablePagefind) {
        await runPagefindIndexing(outDir)
      }

      console.log(`SSG: Done — ${pageCount} pages generated`)
    },
  }

  return [devPlugin, buildPlugin]
}
