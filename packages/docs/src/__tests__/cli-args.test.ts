import { describe, expect, it } from 'vite-plus/test'
import { isInteractive, isNonInteractiveEnv } from '@pagesmith/core/cli-kit'
import { parseLogLevel, parsePort } from '../cli/log-level.js'

describe('parseLogLevel', () => {
  it('accepts canonical values and common aliases', () => {
    expect(parseLogLevel('silent')).toBe('silent')
    expect(parseLogLevel('error')).toBe('error')
    expect(parseLogLevel('errors')).toBe('error')
    expect(parseLogLevel('warn')).toBe('warn')
    expect(parseLogLevel('warning')).toBe('warn')
    expect(parseLogLevel('warnings')).toBe('warn')
    expect(parseLogLevel('info')).toBe('info')
    expect(parseLogLevel('log')).toBe('info')
    expect(parseLogLevel('verbose')).toBe('verbose')
    expect(parseLogLevel('debug')).toBe('verbose')
  })

  it('rejects unknown values with a clear message', () => {
    expect(() => parseLogLevel('chatty')).toThrow(/--log-level must be one of/)
  })
})

describe('parsePort', () => {
  it('accepts numbers and numeric strings within range', () => {
    expect(parsePort(3000)).toBe(3000)
    expect(parsePort('4000')).toBe(4000)
  })

  it('rejects out-of-range or invalid values', () => {
    expect(() => parsePort('0')).toThrow(/between 1 and 65535/)
    expect(() => parsePort('65536')).toThrow(/between 1 and 65535/)
    expect(() => parsePort('abc')).toThrow(/--port must be a valid number/)
  })
})

describe('shared interactive helpers', () => {
  it('re-exports isInteractive / isNonInteractiveEnv from cli-kit', () => {
    expect(typeof isInteractive).toBe('function')
    expect(typeof isNonInteractiveEnv).toBe('function')
  })
})
