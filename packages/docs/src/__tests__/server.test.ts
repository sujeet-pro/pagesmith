import { afterAll, afterEach, describe, expect, it } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { createServer } from 'net'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  createLogger,
  findAvailablePort,
  isPortAvailable,
  resolveStaticRequest,
} from '../server/shared.js'

const servers: ReturnType<typeof createServer>[] = []
const tempDirs: string[] = []

afterAll(() => {
  for (const server of servers) {
    server.close()
  }
})

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  }
})

describe('server shared port helpers', () => {
  it('detects whether a port is available', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, resolve))
    servers.push(server)
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0

    expect(await isPortAvailable(port)).toBe(false)
  })

  it('finds the next available port when strictPort is false', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, resolve))
    servers.push(server)
    const address = server.address()
    const usedPort = typeof address === 'object' && address ? address.port : 0

    const nextPort = await findAvailablePort(usedPort, false, 'dev')
    expect(nextPort).toBeGreaterThan(usedPort)
    expect(await isPortAvailable(nextPort)).toBe(true)
  })
})

describe('server shared logger', () => {
  it('supports level gating for request logging defaults', () => {
    const warnLogger = createLogger('warn')
    const infoLogger = createLogger('info')
    const verboseLogger = createLogger('verbose')

    // Default warn mode should not log request info lines.
    expect(warnLogger.shouldLog('info')).toBe(false)
    // Info enables request/status logging.
    expect(infoLogger.shouldLog('info')).toBe(true)
    // Verbose includes everything.
    expect(verboseLogger.shouldLog('verbose')).toBe(true)
  })
})

describe('server shared static routing', () => {
  it('redirects basePath requests to slashless URLs', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'ps-docs-static-'))
    tempDirs.push(outDir)

    mkdirSync(join(outDir, 'guide', 'intro'), { recursive: true })
    writeFileSync(join(outDir, 'index.html'), '<h1>Home</h1>')
    writeFileSync(join(outDir, 'guide', 'intro', 'index.html'), '<h1>Intro</h1>')
    writeFileSync(join(outDir, '404.html'), '<h1>Not Found</h1>')

    expect(resolveStaticRequest('/', '/pagesmith', outDir)).toEqual({
      type: 'redirect',
      location: '/pagesmith',
    })
    expect(resolveStaticRequest('/pagesmith/', '/pagesmith', outDir)).toEqual({
      type: 'redirect',
      location: '/pagesmith',
    })
    expect(resolveStaticRequest('/pagesmith/guide/intro/', '/pagesmith', outDir)).toEqual({
      type: 'redirect',
      location: '/pagesmith/guide/intro',
    })
  })

  it('serves directory-based index.html for trailingSlash: true output', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'ps-docs-static-'))
    tempDirs.push(outDir)

    mkdirSync(join(outDir, 'guide', 'intro'), { recursive: true })
    writeFileSync(join(outDir, 'index.html'), '<h1>Home</h1>')
    writeFileSync(join(outDir, 'guide', 'intro', 'index.html'), '<h1>Intro</h1>')
    writeFileSync(join(outDir, '404.html'), '<h1>Not Found</h1>')

    expect(resolveStaticRequest('/pagesmith/guide/intro', '/pagesmith', outDir)).toEqual({
      type: 'file',
      filePath: join(outDir, 'guide', 'intro', 'index.html'),
      statusCode: 200,
    })
    expect(resolveStaticRequest('/outside', '/pagesmith', outDir)).toEqual({ type: 'not-found' })
  })

  it('serves flat path.html for trailingSlash: false output', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'ps-docs-static-'))
    tempDirs.push(outDir)

    mkdirSync(join(outDir, 'guide'), { recursive: true })
    writeFileSync(join(outDir, 'index.html'), '<h1>Home</h1>')
    writeFileSync(join(outDir, 'guide', 'intro.html'), '<h1>Intro</h1>')
    writeFileSync(join(outDir, '404.html'), '<h1>Not Found</h1>')

    expect(resolveStaticRequest('/pagesmith/guide/intro', '/pagesmith', outDir)).toEqual({
      type: 'file',
      filePath: join(outDir, 'guide', 'intro.html'),
      statusCode: 200,
    })
    expect(resolveStaticRequest('/pagesmith', '/pagesmith', outDir)).toEqual({
      type: 'file',
      filePath: join(outDir, 'index.html'),
      statusCode: 200,
    })
  })

  it('prefers path.html over path/index.html when both exist', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'ps-docs-static-'))
    tempDirs.push(outDir)

    mkdirSync(join(outDir, 'guide', 'intro'), { recursive: true })
    writeFileSync(join(outDir, 'guide', 'intro.html'), '<h1>Flat</h1>')
    writeFileSync(join(outDir, 'guide', 'intro', 'index.html'), '<h1>Dir</h1>')

    // path.html takes priority (GitHub Pages behavior)
    expect(resolveStaticRequest('/guide/intro', '', outDir)).toEqual({
      type: 'file',
      filePath: join(outDir, 'guide', 'intro.html'),
      statusCode: 200,
    })
  })

  it('rejects traversal attempts outside the output directory', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-static-'))
    const outDir = join(rootDir, 'site')
    tempDirs.push(rootDir)

    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), '<h1>Home</h1>')
    writeFileSync(join(rootDir, 'secret.txt'), 'do not read me')

    expect(resolveStaticRequest('/../secret.txt', '', outDir)).toEqual({ type: 'not-found' })
    expect(resolveStaticRequest('/pagesmith/../secret.txt', '/pagesmith', outDir)).toEqual({
      type: 'not-found',
    })
  })
})
