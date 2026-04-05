import { describe, expect, it } from 'vite-plus/test'
import { parseServerArgs } from '../cli/args.js'

describe('parseServerArgs', () => {
  it('parses log level aliases used in real CLI workflows', () => {
    expect(parseServerArgs(['--log-level', 'info']).logLevel).toBe('info')
    expect(parseServerArgs(['--log-level', 'log']).logLevel).toBe('info')
    expect(parseServerArgs(['--log-level', 'verbose']).logLevel).toBe('verbose')
    expect(parseServerArgs(['--log-level', 'warnings']).logLevel).toBe('warn')
    expect(parseServerArgs(['--log-level', 'errors']).logLevel).toBe('error')
  })

  it('throws on invalid log level values', () => {
    expect(() => parseServerArgs(['--log-level', 'chatty'])).toThrow(/--log-level must be one of/)
  })
})
