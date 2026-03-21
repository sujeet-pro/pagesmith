/**
 * WebSocket-based dev server with page-aware incremental builds.
 *
 * Uses node:http + ws for runtime-agnostic WebSocket support. Watches content,
 * layouts, styles, and diagram files for changes and triggers
 * targeted or full rebuilds as appropriate.
 */

import { watch, } from 'chokidar'
import { existsSync, readFileSync, statSync, } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse, } from 'http'
import { extname, join, relative, } from 'path'
import { type WebSocket, WebSocketServer, } from 'ws'
import { build, } from '../build'
import type { ResolvedConfig, } from '../config'
import { renderDiagrams, } from '../diagrams'
import type { ClientMessage, ServerMessage, } from './types'
import { WS_CLIENT_SCRIPT, } from './ws-client'

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

interface ConnectedClient {
  ws: WebSocket
  currentPage: string
}

const clients = new Set<ConnectedClient>()

/** Send a message to all connected clients. */
function broadcast(msg: ServerMessage,): void {
  const payload = JSON.stringify(msg,)
  for (const client of clients) {
    client.ws.send(payload,)
  }
}

/** Send a message only to clients viewing a specific page path. */
function notifyPage(pagePath: string, msg: ServerMessage,): void {
  const payload = JSON.stringify(msg,)
  for (const client of clients) {
    if (matchesPage(client.currentPage, pagePath,)) {
      client.ws.send(payload,)
    }
  }
}

/**
 * Check if a client's current page matches the changed content path.
 * A client at `/articles/foo/` matches content path `articles/foo`.
 */
function matchesPage(clientPath: string, contentPath: string,): boolean {
  const normalized = clientPath.replace(/^\/|\/$/g, '',)
  return normalized === contentPath
}

/**
 * Determine what kind of rebuild is needed based on the changed file path.
 */
function classifyChange(filePath: string, contentDir: string,): string | null {
  const rel = relative(contentDir, filePath,)
  if (rel.startsWith('..',)) return null
  if (rel === 'site.json5' || rel === 'redirects.json5') return null
  if (rel.endsWith('meta.json5',)) return null
  const parts = rel.split('/',)
  if (parts.length >= 3) return `${parts[0]}/${parts[1]}`
  return null
}

/** Serve a file from the output directory. */
function serveFile(filePath: string, res: ServerResponse,): void {
  const ext = extname(filePath,)
  const contentType = MIME[ext] || 'application/octet-stream'
  const body = readFileSync(filePath,)

  if (ext === '.html') {
    const html = body.toString().replace('</body>', `${WS_CLIENT_SCRIPT}</body>`,)
    res.writeHead(200, { 'Content-Type': contentType, },)
    res.end(html,)
    return
  }

  res.writeHead(200, { 'Content-Type': contentType, },)
  res.end(body,)
}

export async function startDev(
  config: ResolvedConfig,
  options?: { port?: number },
): Promise<void> {
  const port = options?.port ?? 3000
  const { rootDir: ROOT, contentDir: CONTENT_DIR, outDir: OUT_DIR, } = config

  // ── Initial build ──
  console.log('Rendering diagrams...',)
  await renderDiagrams({ contentDir: CONTENT_DIR, },)

  console.log('Building...',)
  await build(config,)

  // ── Start server ──
  const server = createServer((req: IncomingMessage, res: ServerResponse,) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`,)

    let filePath = join(OUT_DIR, url.pathname,)

    // Redirect directories to trailing slash so relative paths resolve
    if (
      !url.pathname.endsWith('/',)
      && existsSync(filePath,)
      && statSync(filePath,).isDirectory()
    ) {
      res.writeHead(301, { Location: `${url.pathname}/`, },)
      res.end()
      return
    }

    // Resolve directory to index.html
    if (existsSync(filePath,) && statSync(filePath,).isDirectory()) {
      filePath = join(filePath, 'index.html',)
    }

    if (!existsSync(filePath,)) {
      const notFoundPath = join(OUT_DIR, '404.html',)
      if (existsSync(notFoundPath,)) {
        const html404 = readFileSync(notFoundPath, 'utf-8',)
          .replace('</body>', `${WS_CLIENT_SCRIPT}</body>`,)
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', },)
        res.end(html404,)
        return
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', },)
      res.end('<h1>404 — Not Found</h1>',)
      return
    }

    serveFile(filePath, res,)
  },)

  // ── WebSocket server ──
  const wss = new WebSocketServer({ server, path: '/__ws', },)

  wss.on('connection', (ws,) => {
    const client: ConnectedClient = { ws, currentPage: '/', }
    clients.add(client,)

    ws.on('message', (data,) => {
      try {
        const msg: ClientMessage = JSON.parse(String(data,),)
        if (msg.type === 'page') {
          client.currentPage = msg.path
        }
      } catch {
        // Ignore malformed messages
      }
    },)

    ws.on('close', () => {
      clients.delete(client,)
    },)
  },)

  server.listen(port, () => {
    console.log(`\nDev server: http://localhost:${port}\n`,)
  },)

  // ── File watchers ──
  let building = false
  let pendingRebuild = false

  // Content / layout / styles watcher
  const watcher = watch(
    [
      CONTENT_DIR,
      ...config.layoutsDirs,
      config.stylesDir,
    ],
    {
      ignoreInitial: true,
      ignored: [
        /node_modules|dist|dev/,
        /\.(mermaid|excalidraw)$/,
        /manifest\.json$/,
      ],
    },
  )

  watcher.on('all', async (event, changedPath,) => {
    if (building) {
      pendingRebuild = true
      return
    }
    building = true

    console.log(`\n${event}: ${changedPath}`,)

    try {
      const contentSlug = classifyChange(changedPath, CONTENT_DIR,)
      const isLayoutOrStyleChange = config.layoutsDirs.some(
        (d,) => changedPath.startsWith(d,),
      ) || changedPath.startsWith(config.stylesDir,)

      if (contentSlug && !isLayoutOrStyleChange) {
        console.log(`Rebuilding (content change: ${contentSlug})...`,)
        await build(config,)
        notifyPage(contentSlug, { type: 'reload', },)
        const contentType = contentSlug.split('/',)[0]
        notifyPage(contentType, { type: 'reload', },)
        notifyPage('', { type: 'reload', },)
      } else {
        console.log('Rebuilding (full)...',)
        await build(config,)
        broadcast({ type: 'reload', },)
      }
    } catch (err) {
      console.error('Build error:', err,)
    }

    building = false

    if (pendingRebuild) {
      pendingRebuild = false
      console.log('Pending rebuild detected, rebuilding...',)
      building = true
      try {
        await build(config,)
        broadcast({ type: 'reload', },)
      } catch (err) {
        console.error('Build error:', err,)
      }
      building = false
    }
  },)

  // ── Diagram watcher ──
  const diagramWatcher = watch(
    [
      join(CONTENT_DIR, '**/*.mermaid',),
      join(CONTENT_DIR, '**/*.excalidraw',),
    ],
    {
      ignoreInitial: true,
      ignored: /node_modules|dist|dev/,
    },
  )

  diagramWatcher.on('all', async (event, changedPath,) => {
    if (building) {
      pendingRebuild = true
      return
    }
    building = true

    console.log(`\n${event} (diagram): ${changedPath}`,)

    try {
      await renderDiagrams({ contentDir: CONTENT_DIR, file: changedPath, },)
      await build(config,)

      const rel = relative(CONTENT_DIR, changedPath,)
      const parts = rel.split('/',)
      if (parts.length >= 3) {
        const contentSlug = `${parts[0]}/${parts[1]}`
        notifyPage(contentSlug, { type: 'reload', },)
      } else {
        broadcast({ type: 'reload', },)
      }
    } catch (err) {
      console.error('Diagram/build error:', err,)
    }

    building = false

    if (pendingRebuild) {
      pendingRebuild = false
      building = true
      try {
        await renderDiagrams({ contentDir: CONTENT_DIR, },)
        await build(config,)
        broadcast({ type: 'reload', },)
      } catch (err) {
        console.error('Build error:', err,)
      }
      building = false
    }
  },)
}
