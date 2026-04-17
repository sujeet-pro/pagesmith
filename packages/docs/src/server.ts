import { existsSync, readFileSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'
import { type WebSocket, WebSocketServer } from 'ws'
import {
  getThemeRoot,
  resolveDocsConfigAsync,
  type DocsDevOptions,
  type ResolvedDocsConfig,
} from './config.js'
import { loadDocsPages, loadRootMeta, loadSectionMetas, type SiteModel } from './content.js'
import { buildSiteModel } from './navigation.js'
import { build, rebuildContent } from './build.js'
import {
  createLogger,
  findAvailablePort,
  logStartupSummary,
  openBrowser,
  resolveStaticRequest,
  serveFile,
} from './server/shared'

function getDisplayHost(host: string): string {
  return host === '0.0.0.0' || host === '::' ? 'localhost' : host
}

async function loadSiteModel(config: ResolvedDocsConfig): Promise<SiteModel> {
  const rootMeta = loadRootMeta(config.contentDir)
  const sectionMetas = loadSectionMetas(config.contentDir)
  const pages = await loadDocsPages(config, sectionMetas)
  return buildSiteModel(config, pages, rootMeta, sectionMetas)
}

export async function startDev(options: DocsDevOptions = {}): Promise<void> {
  const configPath = resolve(options.configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const logger = createLogger(options.logLevel ?? 'warn')
  const buildOverrides: { configPath: string; outDir?: string; basePath?: string } = {
    configPath,
    outDir: options.outDir,
    basePath: options.basePath,
  }

  await build(buildOverrides)
  const config = await resolveDocsConfigAsync(configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })
  const requestedPort = options.port ?? config.server.devPort
  const strictPort = options.port !== undefined
  const port = await findAvailablePort(requestedPort, strictPort, 'dev', logger)
  const themeRoot = getThemeRoot()
  const watchTargets = [config.contentDir, configPath, themeRoot]
  if (existsSync(config.publicDir)) {
    watchTargets.push(config.publicDir)
  }

  let rebuilding = false
  let pending: 'full' | 'content' | false = false
  const clients = new Set<WebSocket>()

  const base = config.basePath.replace(/\/+$/, '')

  function logRequest(status: number, method: string, pathname: string): void {
    if (!logger.shouldLog('info')) return
    const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[36m' : '\x1b[33m'
    logger.info(`  ${color}${status}\x1b[0m ${method} ${pathname}`)
  }

  function notifyClients(): void {
    const payload = JSON.stringify({ type: 'reload' })
    for (const client of clients) {
      try {
        client.send(payload)
      } catch (error) {
        logger.warn(`  WS notify failed: ${error instanceof Error ? error.message : String(error)}`)
      }
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
      logger.info('  \x1b[36mConfig changed, rebuilding...\x1b[0m')
    }
    const start = performance.now()
    if (type === 'full') {
      await build(buildOverrides)
    } else {
      await rebuildContent(buildOverrides)
    }
    const elapsed = Math.round(performance.now() - start)
    logger.info(
      `  \x1b[36m${type === 'full' ? 'Full rebuild' : 'Content rebuild'} in ${elapsed}ms\x1b[0m`,
    )
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url || '/', `http://localhost:${port}`)
      const method = req.method || 'GET'
      const pathname = url.pathname

      // Serve font files from site assets during dev (before static resolution)
      if (
        base ? pathname.startsWith(`${base}/assets/fonts/`) : pathname.startsWith('/assets/fonts/')
      ) {
        const fontFile = pathname.replace(/.*\/assets\/fonts\//, '')
        if (fontFile && !fontFile.includes('..') && !fontFile.includes('/')) {
          const sitePkgDir = dirname(
            fileURLToPath(import.meta.resolve('@pagesmith/site/package.json')),
          )
          const fontPath = join(sitePkgDir, 'assets', 'fonts', fontFile)
          if (existsSync(fontPath)) {
            logRequest(200, method, url.pathname)
            res.writeHead(200, {
              'Content-Type': 'font/woff2',
              'Cache-Control': 'public, max-age=31536000',
            })
            res.end(readFileSync(fontPath))
            return
          }
        }
      }

      const result = resolveStaticRequest(pathname, base, config.outDir)

      if (result.type === 'redirect') {
        logRequest(302, method, pathname)
        res.writeHead(302, { Location: result.location })
        res.end()
        return
      }

      if (result.type === 'not-found') {
        logRequest(404, method, url.pathname)
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<h1>404</h1>')
        return
      }

      logRequest(result.statusCode, method, url.pathname)
      serveFile(result.filePath, res, true, result.statusCode)
    } catch (error) {
      logger.error(
        `  Dev request failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      }
      res.end('Internal server error')
    }
  })

  const wss = new WebSocketServer({ server, path: '/__ws' })
  wss.on('connection', (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
    socket.on('error', (error) =>
      logger.warn(`  WS socket error: ${error instanceof Error ? error.message : String(error)}`),
    )
  })
  wss.on('error', (error) =>
    logger.warn(`  WS server error: ${error instanceof Error ? error.message : String(error)}`),
  )

  const devUrl = `http://${getDisplayHost(config.server.host)}:${port}${base || ''}`

  // Load site model for startup summary
  const model = await loadSiteModel(config)

  server.listen(port, config.server.host, () => {
    console.log()
    console.log(`  Docs dev: ${devUrl}`)
    console.log()
    logStartupSummary(config, model, devUrl)
    if (options.open) openBrowser(devUrl)
  })
  server.on('error', (error) =>
    logger.error(`  Dev server error: ${error instanceof Error ? error.message : String(error)}`),
  )

  const watcher = watch(watchTargets, { ignoreInitial: true })
  watcher.on('error', (error) =>
    logger.warn(`  Watcher error: ${error instanceof Error ? error.message : String(error)}`),
  )
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
      logger.error(`  Rebuild failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      rebuilding = false
      while (pending) {
        const nextType = pending
        pending = false
        rebuilding = true
        try {
          await doRebuild(nextType)
          notifyClients()
        } catch (err) {
          logger.error(`  Rebuild failed: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
          rebuilding = false
        }
      }
    }
  })
}

export async function preview(options: DocsDevOptions = {}): Promise<void> {
  const logger = createLogger(options.logLevel ?? 'warn')
  const config = await resolveDocsConfigAsync(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })

  const { validateConfig: validate, reportConfigIssues: report } = await import('./config.js')
  const issues = validate(config)
  if (issues.length > 0) {
    const hasErrors = report(issues)
    if (hasErrors) {
      throw new Error('Config validation failed — fix the errors above.')
    }
  }

  const requestedPort = options.port ?? config.server.previewPort
  const strictPort = options.port !== undefined
  const port = await findAvailablePort(requestedPort, strictPort, 'preview', logger)
  const previewBase = config.basePath.replace(/\/+$/, '')

  function logRequest(status: number, method: string, pathname: string): void {
    if (!logger.shouldLog('info')) return
    const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[36m' : '\x1b[33m'
    logger.info(`  ${color}${status}\x1b[0m ${method} ${pathname}`)
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url || '/', `http://localhost:${port}`)
      const method = req.method || 'GET'
      const pathname = url.pathname

      const result = resolveStaticRequest(pathname, previewBase, config.outDir)

      if (result.type === 'redirect') {
        logRequest(302, method, pathname)
        res.writeHead(302, { Location: result.location })
        res.end()
        return
      }

      if (result.type === 'not-found') {
        logRequest(404, method, url.pathname)
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }

      logRequest(result.statusCode, method, url.pathname)
      serveFile(result.filePath, res, false, result.statusCode)
    } catch (error) {
      logger.error(
        `  Preview request failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      }
      res.end('Internal server error')
    }
  })

  const previewUrl = `http://${getDisplayHost(config.server.host)}:${port}${previewBase || ''}`

  // Load site model for startup summary
  const model = await loadSiteModel(config)

  server.listen(port, config.server.host, () => {
    console.log()
    console.log(`  Docs preview: ${previewUrl}`)
    console.log()
    logStartupSummary(config, model, previewUrl)
    if (options.open) openBrowser(previewUrl)
  })
  server.on('error', (error) =>
    logger.error(
      `  Preview server error: ${error instanceof Error ? error.message : String(error)}`,
    ),
  )
}
