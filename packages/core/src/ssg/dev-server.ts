/**
 * WebSocket-based dev server with page-aware incremental rebuilds.
 *
 * Uses node:http + ws for runtime-agnostic WebSocket support. Watches
 * configured directories for changes and triggers targeted or full
 * rebuilds via the provided `buildFn` callback.
 */

import { watch } from 'chokidar'
import { existsSync, readFileSync, statSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { extname, join, relative, resolve } from 'path'
import { type WebSocket, WebSocketServer } from 'ws'
import { exec } from 'child_process'
import type { ClientMessage, DevServerOptions, ServerMessage } from './types'
import { WS_CLIENT_SCRIPT } from './ws-client'

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
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

interface ConnectedClient {
  ws: WebSocket
  currentPage: string
}

const clients = new Set<ConnectedClient>()

/** Send a message to all connected clients. */
function broadcast(msg: ServerMessage): void {
  const payload = JSON.stringify(msg)
  for (const client of clients) {
    client.ws.send(payload)
  }
}

/** Send a message only to clients viewing a specific page path. */
function notifyPage(pagePath: string, msg: ServerMessage): void {
  const payload = JSON.stringify(msg)
  for (const client of clients) {
    if (matchesPage(client.currentPage, pagePath)) {
      client.ws.send(payload)
    }
  }
}

/**
 * Check if a client's current page matches the changed content path.
 * A client at `/articles/foo/` matches content path `articles/foo`.
 */
function matchesPage(clientPath: string, contentPath: string): boolean {
  const normalized = clientPath.replace(/^\/|\/$/g, '')
  return normalized === contentPath
}

/**
 * Determine what kind of rebuild is needed based on the changed file path.
 * Returns a content slug like `articles/foo` for targeted rebuilds, or null
 * for site-level config changes that don't map to a single page.
 */
function classifyChange(filePath: string, contentDir: string): string | null {
  const rel = relative(contentDir, filePath)
  if (rel.startsWith('..')) return null
  if (rel === 'site.json5' || rel === 'redirects.json5') return null
  if (rel.endsWith('meta.json5')) return null
  const parts = rel.split('/')
  if (parts.length >= 3) return `${parts[0]}/${parts[1]}`
  return null
}

/** Serve a file from the output directory, injecting WS client into HTML. */
function serveFile(filePath: string, res: ServerResponse): void {
  const ext = extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  const body = readFileSync(filePath)

  if (ext === '.html') {
    const html = body.toString().replace('</body>', `${WS_CLIENT_SCRIPT}</body>`)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(html)
    return
  }

  res.writeHead(200, { 'Content-Type': contentType })
  res.end(body)
}

/**
 * Start a dev server with WebSocket HMR and file watching.
 *
 * All build logic is delegated to `options.buildFn` and `options.diagramFn`,
 * making this server reusable across different build systems.
 */
export async function startDev(options: DevServerOptions): Promise<void> {
  const {
    outDir,
    contentDir,
    watchDirs,
    diagramExtPattern,
    port = 3000,
    open = false,
    buildFn,
    diagramFn,
  } = options

  // ── Initial build ──
  if (diagramFn) {
    console.log('Rendering diagrams...')
    await diagramFn({})
  }

  console.log('Building...')
  await buildFn()

  // ── Start server ──
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)

    let filePath = join(outDir, url.pathname)

    // Prevent path traversal attacks
    if (!resolve(filePath).startsWith(resolve(outDir))) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    // Redirect directories to trailing slash so relative paths resolve
    if (!url.pathname.endsWith('/') && existsSync(filePath) && statSync(filePath).isDirectory()) {
      res.writeHead(301, { Location: `${url.pathname}/` })
      res.end()
      return
    }

    // Resolve directory to index.html
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
        const html404 = readFileSync(foundPath, 'utf-8').replace(
          '</body>',
          `${WS_CLIENT_SCRIPT}</body>`,
        )
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html404)
        return
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>404 — Not Found</h1>')
      return
    }

    serveFile(filePath, res)
  })

  // ── WebSocket server ──
  const wss = new WebSocketServer({ server, path: '/__ws' })

  wss.on('connection', (ws) => {
    const client: ConnectedClient = { ws, currentPage: '/' }
    clients.add(client)

    ws.on('message', (data) => {
      try {
        const msg: ClientMessage = JSON.parse(String(data as string | Buffer))
        if (msg.type === 'page') {
          client.currentPage = msg.path
        }
      } catch {
        // Ignore malformed messages
      }
    })

    ws.on('close', () => {
      clients.delete(client)
    })
  })

  const url = `http://localhost:${port}`
  server.listen(port, () => {
    console.log(`\nDev server: ${url}\n`)
    if (open) openBrowser(url)
  })

  // ── File watchers ──
  let building = false
  let pendingRebuild = false

  // Build the ignore patterns for the content watcher
  const ignored: (RegExp | string)[] = [/node_modules|dist|dev/, /diagrams\.manifest\.json$/]
  if (diagramExtPattern) {
    ignored.push(diagramExtPattern)
  }

  // Content / layout / styles watcher
  const watcher = watch(watchDirs, {
    ignoreInitial: true,
    ignored,
  })

  watcher.on('all', async (event, changedPath) => {
    if (building) {
      pendingRebuild = true
      return
    }
    building = true

    console.log(`\n${event}: ${changedPath}`)

    try {
      const contentSlug = classifyChange(changedPath, contentDir)
      const isNonContentChange = !changedPath.startsWith(contentDir)

      if (contentSlug && !isNonContentChange) {
        console.log(`Rebuilding (content change: ${contentSlug})...`)
        await buildFn()
        notifyPage(contentSlug, { type: 'reload' })
        const contentType = contentSlug.split('/')[0]
        notifyPage(contentType, { type: 'reload' })
        notifyPage('', { type: 'reload' })
      } else {
        console.log('Rebuilding (full)...')
        await buildFn()
        broadcast({ type: 'reload' })
      }
    } catch (err) {
      console.error('Build error:', err)
    }

    building = false

    if (pendingRebuild) {
      pendingRebuild = false
      console.log('Pending rebuild detected, rebuilding...')
      building = true
      try {
        await buildFn()
        broadcast({ type: 'reload' })
      } catch (err) {
        console.error('Build error:', err)
      }
      building = false
    }
  })

  // ── Diagram watcher (optional) ──
  if (diagramFn && diagramExtPattern) {
    // Build glob patterns from the regex source — extract extensions from the pattern
    // The diagramExtPattern is expected to match file extensions like .mermaid, .excalidraw, etc.
    const extMatches = diagramExtPattern.source.match(/\\\.\w+/g) || []
    const diagramGlobs = extMatches.map((ext) => join(contentDir, `**/*${ext.replace('\\', '')}`))

    if (diagramGlobs.length > 0) {
      const diagramWatcher = watch(diagramGlobs, {
        ignoreInitial: true,
        ignored: /node_modules|dist|dev/,
      })

      diagramWatcher.on('all', async (event, changedPath) => {
        if (building) {
          pendingRebuild = true
          return
        }
        building = true

        console.log(`\n${event} (diagram): ${changedPath}`)

        try {
          await diagramFn({ file: changedPath })
          await buildFn()

          const rel = relative(contentDir, changedPath)
          const parts = rel.split('/')
          if (parts.length >= 3) {
            const contentSlug = `${parts[0]}/${parts[1]}`
            notifyPage(contentSlug, { type: 'reload' })
          } else {
            broadcast({ type: 'reload' })
          }
        } catch (err) {
          console.error('Diagram/build error:', err)
        }

        building = false

        if (pendingRebuild) {
          pendingRebuild = false
          building = true
          try {
            await diagramFn({})
            await buildFn()
            broadcast({ type: 'reload' })
          } catch (err) {
            console.error('Build error:', err)
          }
          building = false
        }
      })
    }
  }
}
