import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'

/**
 * Vite plugin that serves shared font assets during development.
 * In production, fonts are copied to the output directory by the build script.
 */
export function sharedAssetsPlugin(): Plugin {
  const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const assetsDir = join(pkgDir, 'assets')

  return {
    name: 'pagesmith:shared-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''

        // Serve fonts.css
        if (url === '/assets/fonts.css' || url.endsWith('/assets/fonts.css')) {
          const filePath = join(assetsDir, 'fonts.css')
          if (existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-cache' })
            res.end(readFileSync(filePath, 'utf-8'))
            return
          }
        }

        // Serve font files
        if (url.includes('/assets/fonts/') && url.endsWith('.woff2')) {
          const fileName = url.split('/assets/fonts/').pop()
          if (fileName) {
            const filePath = join(assetsDir, 'fonts', fileName)
            if (existsSync(filePath)) {
              res.writeHead(200, {
                'Content-Type': 'font/woff2',
                'Cache-Control': 'public, max-age=31536000',
              })
              res.end(readFileSync(filePath))
              return
            }
          }
        }

        next()
      })
    },
  }
}
