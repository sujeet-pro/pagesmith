import { exec } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { createServer as createNetServer } from 'net'
import { dirname, extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'
import { type WebSocket, WebSocketServer } from 'ws'
import {
  getThemeRoot,
  resolveDocsConfig,
  type DocsDevOptions,
  type ResolvedDocsConfig,
} from './config.js'
import { loadDocsPages, loadRootMeta, loadSectionMetas, type SiteModel } from './content.js'
import { buildSiteModel } from './navigation.js'
import { build, rebuildContent } from './build.js'

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

async function loadSiteModel(config: ResolvedDocsConfig): Promise<SiteModel> {
  const rootMeta = loadRootMeta(config.contentDir)
  const sectionMetas = loadSectionMetas(config.contentDir)
  const pages = await loadDocsPages(config, sectionMetas)
  return buildSiteModel(config, pages, rootMeta, sectionMetas)
}

function logStartupSummary(config: ResolvedDocsConfig, model: SiteModel, baseUrl: string): void {
  const pageCount = model.pageByPath.size
  const sectionCount = model.sidebarBySection.size

  console.log(`  ${pageCount} pages in ${sectionCount} sections`)
  console.log()

  for (const [, sections] of model.sidebarBySection) {
    const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0)
    const title = sections[0]?.title ?? '(unknown)'
    const firstPath = sections[0]?.items[0]?.path ?? ''
    const url = firstPath ? `${baseUrl.replace(/\/$/, '')}${firstPath}/` : baseUrl
    console.log(`  ${title} (${itemCount} pages)  ${url}`)
  }

  console.log()
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port)
  })
}

async function findAvailablePort(
  startPort: number,
  strictPort: boolean,
  label: string,
): Promise<number> {
  if (await isPortAvailable(startPort)) return startPort
  if (strictPort) {
    throw new Error(
      `Port ${startPort} is already in use (${label}). Disable strictPort to auto-find an available port.`,
    )
  }
  const maxAttempts = 20
  for (let port = startPort + 1; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      console.log(`  Port ${startPort} in use, using ${port}`)
      return port
    }
  }
  throw new Error(`No available port found in range ${startPort}–${startPort + maxAttempts - 1}`)
}

export async function startDev(options: DocsDevOptions = {}): Promise<void> {
  const configPath = resolve(options.configPath ?? join(process.cwd(), 'pagesmith.config.json5'))

  await build({ configPath })
  const config = resolveDocsConfig(configPath)
  const requestedPort = options.port ?? config.server.devPort
  const port = await findAvailablePort(requestedPort, config.server.strictPort, 'dev')
  const themeRoot = getThemeRoot()
  const watchTargets = [config.contentDir, configPath, themeRoot]
  if (existsSync(config.publicDir)) {
    watchTargets.push(config.publicDir)
  }

  let rebuilding = false
  let pending: 'full' | 'content' | false = false
  const clients = new Set<WebSocket>()

  const base = config.basePath.replace(/\/+$/, '')

  function log(status: number, method: string, pathname: string): void {
    const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[36m' : '\x1b[33m'
    console.log(`  ${color}${status}\x1b[0m ${method} ${pathname}`)
  }

  function notifyClients(): void {
    const payload = JSON.stringify({ type: 'reload' })
    for (const client of clients) {
      client.send(payload)
    }
  }

  /**
   * Determine rebuild type based on changed file path.
   * Config/theme changes require full rebuild; content changes only need content rebuild.
   */
  function getChangeType(changedPath: string): 'full' | 'content' {
    const resolved = resolve(changedPath)
    if (resolved === resolve(configPath)) return 'full'
    if (resolved.startsWith(resolve(themeRoot))) return 'full'
    return 'content'
  }

  async function doRebuild(type: 'full' | 'content', changedPath?: string): Promise<void> {
    if (type === 'full' && changedPath && resolve(changedPath) === resolve(configPath)) {
      console.log('  \x1b[36mConfig changed, rebuilding...\x1b[0m')
    }
    const start = performance.now()
    if (type === 'full') {
      await build({ configPath })
    } else {
      await rebuildContent({ configPath })
    }
    const elapsed = Math.round(performance.now() - start)
    console.log(
      `  \x1b[36m${type === 'full' ? 'Full rebuild' : 'Content rebuild'} in ${elapsed}ms\x1b[0m`,
    )
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

  // Load site model for startup summary
  const model = await loadSiteModel(config)

  server.listen(port, () => {
    console.log()
    console.log(`  Docs dev: ${devUrl}`)
    console.log()
    logStartupSummary(config, model, devUrl)
    if (options.open) openBrowser(devUrl)
  })

  const watcher = watch(watchTargets, { ignoreInitial: true })
  watcher.on('all', async (_event, changedPath) => {
    const changeType = getChangeType(changedPath)

    if (rebuilding) {
      // Escalate to full if any pending change requires it
      pending = pending === 'full' || changeType === 'full' ? 'full' : 'content'
      return
    }

    rebuilding = true
    try {
      await doRebuild(changeType, changedPath)
      notifyClients()
    } catch (err) {
      console.error('Rebuild failed:', err instanceof Error ? err.message : err)
    } finally {
      rebuilding = false
      if (pending) {
        const nextType = pending
        pending = false
        rebuilding = true
        try {
          await doRebuild(nextType)
          notifyClients()
        } catch (err) {
          console.error('Rebuild failed:', err instanceof Error ? err.message : err)
        } finally {
          rebuilding = false
        }
      }
    }
  })
}

export async function preview(options: DocsDevOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath)
  const requestedPort = options.port ?? config.server.previewPort
  const port = await findAvailablePort(requestedPort, config.server.strictPort, 'preview')
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

  // Load site model for startup summary
  const model = await loadSiteModel(config)

  server.listen(port, () => {
    console.log()
    console.log(`  Docs preview: ${previewUrl}`)
    console.log()
    logStartupSummary(config, model, previewUrl)
    if (options.open) openBrowser(previewUrl)
  })
}
