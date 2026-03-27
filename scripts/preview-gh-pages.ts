#!/usr/bin/env node

/**
 * Preview the gh-pages output locally.
 *
 * Rewrites /pagesmith/* → /* so that links built for GitHub Pages
 * (where the repo root is at /pagesmith/) resolve correctly against
 * the local gh-pages/ directory.
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { createServer } from 'http'
import { extname, join, resolve } from 'path'

const OUT = join(process.cwd(), 'gh-pages')
const REPO_PREFIX = '/pagesmith'
const port = parseInt(process.env.PORT || '3000', 10)

if (!existsSync(OUT)) {
  console.error(`gh-pages/ not found. Run "npm run build" first.`)
  process.exit(1)
}

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

const server = createServer((req, res) => {
  let url = (req.url || '/').split('?')[0]

  // Rewrite /pagesmith/* → /* for local preview
  if (url === REPO_PREFIX) {
    url = '/'
  } else if (url.startsWith(`${REPO_PREFIX}/`)) {
    url = url.slice(REPO_PREFIX.length)
  }

  let filePath = join(OUT, url)

  // Prevent path traversal
  if (!resolve(filePath).startsWith(resolve(OUT))) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  // Redirect directories to trailing slash
  if (!url.endsWith('/') && existsSync(filePath) && statSync(filePath).isDirectory()) {
    res.writeHead(301, { Location: `${req.url}/` })
    res.end()
    return
  }

  // Resolve directory to index.html
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>404 — Not Found</h1>')
    return
  }

  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  res.end(readFileSync(filePath))
})

server.listen(port, () => {
  console.log(`\nPreview: http://localhost:${port}\n`)
  console.log(`  Landing:  http://localhost:${port}/`)
  console.log(`  Docs:     http://localhost:${port}/docs/`)
  console.log(`  Examples: http://localhost:${port}/examples/\n`)
})
