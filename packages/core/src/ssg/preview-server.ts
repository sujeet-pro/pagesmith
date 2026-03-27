/**
 * Static preview server.
 *
 * Serves a pre-built output directory with no rebuilding or watching.
 * Run the build step first, then start the preview server.
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { extname, join, resolve } from 'path'
import type { PreviewOptions } from './types'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Start a static preview server for the built output.
 */
export async function startPreview(options?: PreviewOptions): Promise<void> {
  const port = options?.port ?? parseInt(process.env.PORT || '4000', 10)
  const outDir = options?.outDir ?? join(process.cwd(), 'dist')

  if (!existsSync(outDir)) {
    console.error(`Output directory not found: ${outDir}. Run the build step first.`)
    process.exit(1)
  }

  function serve(req: IncomingMessage, res: ServerResponse) {
    const url = (req.url || '/').split('?')[0]

    let filePath = join(outDir, url)

    // Prevent path traversal attacks
    if (!resolve(filePath).startsWith(resolve(outDir))) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    // Redirect directories to trailing slash so relative paths resolve
    if (!url.endsWith('/') && existsSync(filePath) && statSync(filePath).isDirectory()) {
      res.writeHead(301, { Location: url + '/' })
      res.end()
      return
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      // Try both 404.html and 404/index.html (docs convention)
      const notFoundPath = join(outDir, '404.html')
      const notFoundDirPath = join(outDir, '404', 'index.html')
      const foundPath = existsSync(notFoundPath)
        ? notFoundPath
        : existsSync(notFoundDirPath)
          ? notFoundDirPath
          : undefined
      if (foundPath) {
        const body404 = readFileSync(foundPath)
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(body404)
        return
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>404 — Not Found</h1>')
      return
    }

    const ext = extname(filePath)
    const contentType = MIME[ext] || 'application/octet-stream'
    const body = readFileSync(filePath)

    res.writeHead(200, { 'Content-Type': contentType })
    res.end(body)
  }

  const server = createServer(serve)
  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}\n`)
  })
}
