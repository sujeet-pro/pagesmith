import { exec } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { createServer as createNetServer } from 'net'
import { extname, join } from 'path'
import type { ServerResponse } from 'http'
import type { SiteModel } from '../content'
import type { DocsLogLevel, ResolvedDocsConfig } from '../config'

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

const LOG_RANK: Record<DocsLogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
}

export function createLogger(level: DocsLogLevel = 'warn') {
  const current = LOG_RANK[level]
  const shouldLog = (minimum: DocsLogLevel): boolean => current >= LOG_RANK[minimum]
  return {
    level,
    shouldLog,
    error(message: string): void {
      if (shouldLog('error')) console.error(message)
    },
    warn(message: string): void {
      if (shouldLog('warn')) console.warn(message)
    },
    info(message: string): void {
      if (shouldLog('info')) console.log(message)
    },
    verbose(message: string): void {
      if (shouldLog('verbose')) console.log(message)
    },
  }
}

export function serveFile(
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

export function logStartupSummary(
  config: ResolvedDocsConfig,
  model: SiteModel,
  baseUrl: string,
): void {
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

export function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${JSON.stringify(url)}`)
}

export type StaticRequestResult =
  | { type: 'redirect'; location: string }
  | { type: 'file'; filePath: string; statusCode: number }
  | { type: 'not-found' }

/**
 * Resolve an incoming request pathname to a static file, handling basePath
 * stripping, directory index resolution, and 404 fallback. Shared between
 * dev and preview servers.
 */
export function resolveStaticRequest(
  pathname: string,
  basePath: string,
  outDir: string,
): StaticRequestResult {
  if (basePath && (pathname === '/' || pathname === '')) {
    return { type: 'redirect', location: `${basePath}/` }
  }

  let stripped = pathname
  if (basePath && pathname.startsWith(basePath)) {
    stripped = pathname.slice(basePath.length) || '/'
  }

  let filePath = join(outDir, stripped)
  if (existsSync(filePath) && !extname(filePath)) {
    filePath = join(filePath, 'index.html')
  }

  if (!existsSync(filePath)) {
    const notFoundDir = join(outDir, '404', 'index.html')
    const notFoundFile = join(outDir, '404.html')
    if (existsSync(notFoundDir)) return { type: 'file', filePath: notFoundDir, statusCode: 404 }
    if (existsSync(notFoundFile)) return { type: 'file', filePath: notFoundFile, statusCode: 404 }
    return { type: 'not-found' }
  }

  return { type: 'file', filePath, statusCode: 200 }
}

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port)
  })
}

export async function findAvailablePort(
  startPort: number,
  strictPort: boolean,
  label: string,
  logger: ReturnType<typeof createLogger> = createLogger('warn'),
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
      logger.info(`  Port ${startPort} in use, using ${port}`)
      return port
    }
  }
  throw new Error(`No available port found in range ${startPort}–${startPort + maxAttempts - 1}`)
}
