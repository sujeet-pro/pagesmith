#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'fs'
import { createServer } from 'http'
import { extname, join, resolve } from 'path'

const outDir = join(process.cwd(), 'gh-pages')
const repoPrefix = '/pagesmith'
const port = parseInt(process.env.PORT || '3000', 10)

if (!existsSync(outDir)) {
  console.error('gh-pages/ not found. Run `vp run build` first.')
  process.exit(1)
}

const mime = {
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

  if (url === repoPrefix) {
    url = '/'
  } else if (url.startsWith(`${repoPrefix}/`)) {
    url = url.slice(repoPrefix.length)
  }

  let filePath = join(outDir, url)
  if (!resolve(filePath).startsWith(resolve(outDir))) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (!url.endsWith('/') && existsSync(filePath) && statSync(filePath).isDirectory()) {
    res.writeHead(301, { Location: `${req.url}/` })
    res.end()
    return
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>404 - Not Found</h1>')
    return
  }

  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
  res.end(readFileSync(filePath))
})

server.listen(port, () => {
  const base = `http://localhost:${port}${repoPrefix}`
  console.log(`\nPreview: ${base}/\n`)
  console.log(`  Docs:     ${base}/`)
  console.log(`  Examples: ${base}/examples/\n`)
})
