#!/usr/bin/env node

/**
 * Static file server for previewing the built gh-pages output.
 *
 * Serves from gh-pages/ with directory index resolution and
 * clean URL support (e.g., /docs/getting-started/ -> index.html).
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { createServer } from 'http'
import { extname, join } from 'path'

const PORT = parseInt(process.env.PORT || '4000', 10)
const ROOT = join(process.cwd(), 'gh-pages')

if (!existsSync(ROOT)) {
  console.error('Error: gh-pages/ directory not found. Run `npm run build:site` first.')
  process.exit(1)
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

function resolve(urlPath: string): string | null {
  // Strip /pagesmith prefix if present (gh-pages expects it in links
  // but we serve from root locally)
  let cleaned = urlPath.replace(/^\/pagesmith/, '') || '/'

  // Try exact file
  let filePath = join(ROOT, cleaned)
  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath

  // Directory -> index.html
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    const idx = join(filePath, 'index.html')
    if (existsSync(idx)) return idx
  }

  // Trailing slash -> index.html
  const withIndex = join(filePath, 'index.html')
  if (existsSync(withIndex)) return withIndex

  // Try .html extension
  const withHtml = filePath + '.html'
  if (existsSync(withHtml)) return withHtml

  return null
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const filePath = resolve(url.pathname)

  if (!filePath) {
    // Try 404 page
    const notFound = join(ROOT, '404.html')
    if (existsSync(notFound)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(readFileSync(notFound))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
    return
  }

  const ext = extname(filePath)
  const mime = MIME[ext] || 'application/octet-stream'

  res.writeHead(200, { 'Content-Type': mime })
  res.end(readFileSync(filePath))
})

server.listen(PORT, () => {
  console.log(`\nPreview server running at http://localhost:${PORT}/pagesmith/`)
  console.log(`  Docs:     http://localhost:${PORT}/pagesmith/docs/`)
  console.log(`  Examples: http://localhost:${PORT}/pagesmith/examples/`)
  console.log(`\nPress Ctrl+C to stop.\n`)
})
