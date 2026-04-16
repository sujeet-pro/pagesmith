/**
 * Minimal static server used by Playwright's webServer.
 *
 * Serves the already-built `gh-pages/` output directory. We intentionally keep
 * this script tiny and dependency-free; the Pagesmith preview server lives in
 * `scripts/preview-gh-pages.ts` and is more feature-rich, but for e2e we only
 * need deterministic, reuse-existing-server-friendly behavior.
 */

import { createReadStream, existsSync, statSync } from 'fs'
import { createServer } from 'http'
import { extname, join, resolve } from 'path'

const args = process.argv.slice(2)
let port = 4411
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]!
  if (arg === '--port') {
    const value = args[i + 1]
    if (!value) throw new Error('--port requires a value')
    port = Number(value)
    i += 1
  } else if (arg.startsWith('--port=')) {
    port = Number(arg.slice('--port='.length))
  }
}

const ROOT = resolve(import.meta.dirname, '..', '..', 'gh-pages')

if (!existsSync(ROOT)) {
  console.error(
    `[pagesmith e2e] gh-pages/ does not exist. Run \`npm run build\` before starting Playwright.`,
  )
  process.exit(1)
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

function resolveRequestPath(urlPath: string): string | undefined {
  const clean = urlPath.split('?')[0]?.replace(/\/+$/, '') ?? ''
  const candidates = [
    join(ROOT, clean),
    join(ROOT, clean, 'index.html'),
    join(ROOT, `${clean}.html`),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  const notFound = join(ROOT, '404.html')
  if (existsSync(notFound)) return notFound
  return undefined
}

const server = createServer((req, res) => {
  const filePath = resolveRequestPath(req.url ?? '/')
  if (!filePath) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  const mime = MIME[extname(filePath)] ?? 'application/octet-stream'
  res.setHeader('content-type', mime)
  res.setHeader('cache-control', 'no-store')
  createReadStream(filePath).pipe(res)
})

server.listen(port, () => {
  console.log(`[pagesmith e2e] serving ${ROOT} on http://localhost:${port}`)
})
