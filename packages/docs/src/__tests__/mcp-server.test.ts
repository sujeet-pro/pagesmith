import { describe, expect, it } from 'vite-plus/test'
import { createDocsMcpServer } from '../mcp/server.js'

describe('createDocsMcpServer', () => {
  it('creates a docs MCP server instance', () => {
    const server = createDocsMcpServer()
    expect(server).toBeDefined()
  })
})
