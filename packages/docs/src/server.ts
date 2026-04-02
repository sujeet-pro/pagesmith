import { exec } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { dirname, extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'
import { type WebSocket, WebSocketServer } from 'ws'
import { getThemeRoot, resolveDocsConfig, type DocsDevOptions } from './config.js'
import { build } from './build.js'

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

const WS_CLIENT_SCRIPT = `<script>
(function() {
  var ws = new WebSocket('ws://' + location.host + '/__ws');
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') location.reload();
  };
  ws.onclose = function() {
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>`

function serveFile(
  filePath: string,
  res: ServerResponse,
  injectReload = false,
  statusCode = 200,
): void {
  const ext = extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  const body = readFileSync(filePath)

  if (ext === '.html' && injectReload) {
    const html = body.toString().replace('</body>', `${WS_CLIENT_SCRIPT}</body>`)
    res.writeHead(statusCode, { 'Content-Type': contentType })
    res.end(html)
    return
  }

  res.writeHead(statusCode, { 'Content-Type': contentType })
  res.end(body)
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
}

export async function startDev(options: DocsDevOptions = {}): Promise<void> {
  const configPath = resolve(options.configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const port = options.port ?? 3001

  await build({ configPath })
  const config = resolveDocsConfig(configPath)
  const watchTargets = [config.contentDir, configPath, getThemeRoot()]
  if (existsSync(config.publicDir)) {
    watchTargets.push(config.publicDir)
  }

  let rebuilding = false
  let pending = false
  const clients = new Set<WebSocket>()

  const base = config.basePath.replace(/\/+$/, '')

  function log(status: number, method: string, pathname: string): void {
    const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[36m' : '\x1b[33m'
    console.log(`  ${color}${status}\x1b[0m ${method} ${pathname}`)
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    const method = req.method || 'GET'
    let pathname = url.pathname

    // Redirect root to basePath
    if (base && (pathname === '/' || pathname === '')) {
      log(302, method, pathname)
      res.writeHead(302, { Location: `${base}/` })
      res.end()
      return
    }

    // Strip basePath prefix so file lookup matches outDir structure
    if (base && pathname.startsWith(base)) {
      pathname = pathname.slice(base.length) || '/'
    }

    // Serve font files from core assets during dev
    if (pathname.startsWith('/assets/fonts/')) {
      const fontFile = pathname.replace('/assets/fonts/', '')
      const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
      const fontPath = join(corePkgDir, 'assets', 'fonts', fontFile)
      if (existsSync(fontPath)) {
        log(200, method, url.pathname)
        res.writeHead(200, {
          'Content-Type': 'font/woff2',
          'Cache-Control': 'public, max-age=31536000',
        })
        res.end(readFileSync(fontPath))
        return
      }
    }

    let filePath = join(config.outDir, pathname)

    if (existsSync(filePath) && !extname(filePath)) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      // Try 404/index.html then 404.html (GitHub Pages convention)
      const notFoundDir = join(config.outDir, '404', 'index.html')
      const notFoundFile = join(config.outDir, '404.html')
      const notFoundPath = existsSync(notFoundDir)
        ? notFoundDir
        : existsSync(notFoundFile)
          ? notFoundFile
          : null
      if (notFoundPath) {
        log(404, method, url.pathname)
        serveFile(notFoundPath, res, true, 404)
        return
      }
      log(404, method, url.pathname)
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>404</h1>')
      return
    }

    log(200, method, url.pathname)
    serveFile(filePath, res, true)
  })

  const wss = new WebSocketServer({ server, path: '/__ws' })
  wss.on('connection', (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
  })

  const devUrl = `http://localhost:${port}${base}/`
  server.listen(port, () => {
    console.log(`\nDocs dev server: ${devUrl}\n`)
    if (options.open) openBrowser(devUrl)
  })

  const watcher = watch(watchTargets, { ignoreInitial: true })
  watcher.on('all', async () => {
    if (rebuilding) {
      pending = true
      return
    }

    rebuilding = true
    try {
      await build({ configPath })
      const payload = JSON.stringify({ type: 'reload' })
      for (const client of clients) {
        client.send(payload)
      }
    } finally {
      rebuilding = false
      if (pending) {
        pending = false
        await build({ configPath })
      }
    }
  })
}

export async function preview(options: DocsDevOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath)
  const port = options.port ?? 4173
  const previewBase = config.basePath.replace(/\/+$/, '')

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    let pathname = url.pathname

    // Redirect root to basePath
    if (previewBase && (pathname === '/' || pathname === '')) {
      res.writeHead(302, { Location: `${previewBase}/` })
      res.end()
      return
    }

    // Strip basePath prefix
    if (previewBase && pathname.startsWith(previewBase)) {
      pathname = pathname.slice(previewBase.length) || '/'
    }

    let filePath = join(config.outDir, pathname)

    if (existsSync(filePath) && !extname(filePath)) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      filePath = join(config.outDir, '404', 'index.html')
      if (!existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
      serveFile(filePath, res, false, 404)
      return
    }

    serveFile(filePath, res)
  })

  const previewUrl = `http://localhost:${port}${previewBase}/`
  server.listen(port, () => {
    console.log(`\nDocs preview: ${previewUrl}\n`)
    if (options.open) openBrowser(previewUrl)
  })
}
