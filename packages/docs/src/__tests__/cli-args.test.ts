import { describe, expect, it } from 'vite-plus/test'
import { parseInitArgs, parseServerArgs } from '../cli/args.js'

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

describe('parseInitArgs', () => {
  it('parses explicit init values for non-interactive setup', () => {
    const args = parseInitArgs([
      '--yes',
      '--name',
      'repo-name',
      '--title',
      'Repo Docs',
      '--origin',
      'https://owner.github.io',
      '--base-path',
      '/repo-name',
      '--content-dir',
      'docs',
      '--no-search',
      '--starter-content',
      '--ai',
    ])

    expect(args.yes).toBe(true)
    expect(args.name).toBe('repo-name')
    expect(args.title).toBe('Repo Docs')
    expect(args.origin).toBe('https://owner.github.io')
    expect(args.basePath).toBe('/repo-name')
    expect(args.contentDir).toBe('docs')
    expect(args.search).toBe(false)
    expect(args.starterContent).toBe(true)
    expect(args.ai).toBe(true)
  })
})
