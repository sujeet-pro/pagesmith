import { afterEach, describe, expect, it } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { build } from '../build.js'

describe('build', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('builds a minimal docs site output', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content'), { recursive: true })
    mkdirSync(join(rootDir, 'public'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Build Test", origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')
    writeFileSync(join(rootDir, 'public', 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf-8')

    await build({ configPath: join(rootDir, 'pagesmith.config.json5') })

    const outDir = join(rootDir, 'gh-pages')
    expect(existsSync(join(outDir, 'index.html'))).toBe(true)
    expect(existsSync(join(outDir, '404.html'))).toBe(true)
    expect(existsSync(join(outDir, '.nojekyll'))).toBe(true)
    expect(existsSync(join(outDir, 'assets', 'style.css'))).toBe(true)

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
    expect(html).toContain('Build Test')
  })
})
