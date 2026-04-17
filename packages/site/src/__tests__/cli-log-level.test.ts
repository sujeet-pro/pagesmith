import { describe, expect, it } from 'vite-plus/test'
import { parseLogLevel, parsePort } from '../cli/log-level.js'

describe('site parseLogLevel', () => {
  it('accepts canonical values and aliases', () => {
    expect(parseLogLevel('silent')).toBe('silent')
    expect(parseLogLevel('errors')).toBe('error')
    expect(parseLogLevel('warning')).toBe('warn')
    expect(parseLogLevel('log')).toBe('info')
    expect(parseLogLevel('debug')).toBe('verbose')
  })

  it('throws on unknown levels', () => {
    expect(() => parseLogLevel('chatty')).toThrow(/--log-level must be one of/)
  })
})

describe('site parsePort', () => {
  it('parses valid ports', () => {
    expect(parsePort(3000)).toBe(3000)
    expect(parsePort('5173')).toBe(5173)
  })

  it('rejects invalid ports', () => {
    expect(() => parsePort('99999')).toThrow(/between 1 and 65535/)
    expect(() => parsePort('hello')).toThrow(/--port must be a valid number/)
  })
})
