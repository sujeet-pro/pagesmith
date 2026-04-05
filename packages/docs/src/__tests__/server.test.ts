import { afterAll, describe, expect, it } from 'vite-plus/test'
import { createServer } from 'net'
import { createLogger, findAvailablePort, isPortAvailable } from '../server/shared.js'

const servers: ReturnType<typeof createServer>[] = []

afterAll(() => {
  for (const server of servers) {
    server.close()
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
