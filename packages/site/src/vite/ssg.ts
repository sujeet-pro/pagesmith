/**
 * Pre-rendering utility for Vite-based SSG sites.
 *
 * Call after running both the client and SSR Vite builds.
 * Loads the SSR module, renders each route, injects into the
 * client HTML template, and writes static files.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { pathToFileURL } from 'url'

export type PrerenderOptions = {
  /** Absolute path to the client build output directory (e.g., `dist/`) */
  outDir: string
  /** Absolute path to the built SSR entry module (e.g., `dist/.server/entry-server.js`) */
  serverEntry: string
  /** Routes to pre-render (e.g., `['/', '/about', '/posts/hello-world']`) */
  routes: string[]
  /** HTML placeholder to replace with rendered content (default: `'<!--ssr-outlet-->'`) */
  placeholder?: string
  /** Remove the server build directory after pre-rendering (default: true) */
  cleanup?: boolean
}

/**
 * Pre-render routes to static HTML files.
 *
 * Expects the SSR entry to export a `render(url: string): string` function.
 *
 * @example
 * ```ts
 * import { build } from 'vite'
 * import { prerenderRoutes } from '@pagesmith/site/vite'
 *
 * // 1. Client build
 * await build({ build: { outDir: 'dist' } })
 *
 * // 2. SSR build
 * await build({ build: { ssr: 'src/entry-server.tsx', outDir: 'dist/.server' } })
 *
 * // 3. Pre-render
 * await prerenderRoutes({
 *   outDir: resolve('dist'),
 *   serverEntry: resolve('dist/.server/entry-server.js'),
 *   routes: ['/', '/about', '/posts/hello-world'],
 * })
 * ```
 */
export async function prerenderRoutes(options: PrerenderOptions): Promise<{ pages: number }> {
  const placeholder = options.placeholder ?? '<!--ssr-outlet-->'
  const cleanup = options.cleanup ?? true

  // Load SSR module
  if (!existsSync(options.serverEntry)) {
    throw new Error(`SSR entry not found: ${options.serverEntry}`)
  }

  const mod = await import(pathToFileURL(options.serverEntry).href)
  const render: (url: string) => string | Promise<string> = mod.render ?? mod.default?.render

  if (typeof render !== 'function') {
    throw new Error(
      `SSR entry must export a 'render(url: string)' function. ` +
        `Found exports: ${Object.keys(mod).join(', ')}`,
    )
  }

  // Read client HTML template
  const templatePath = resolve(options.outDir, 'index.html')
  const template = readFileSync(templatePath, 'utf-8')

  if (!template.includes(placeholder)) {
    throw new Error(
      `HTML template does not contain placeholder "${placeholder}". ` +
        `Add it to your index.html where SSR content should be injected.`,
    )
  }

  // Pre-render each route
  for (const route of options.routes) {
    const rendered = await render(route)
    const html = template.replace(placeholder, rendered)

    const routePath = route === '/' ? '' : route.replace(/^\//, '')
    const outPath = resolve(options.outDir, routePath, 'index.html')
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, html)
  }

  // Clean up server build
  if (cleanup) {
    const serverDir = dirname(options.serverEntry)
    rmSync(serverDir, { recursive: true, force: true })
  }

  return { pages: options.routes.length }
}
