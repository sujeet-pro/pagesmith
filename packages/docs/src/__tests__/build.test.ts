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

    await build({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' })

    const outDir = join(rootDir, 'gh-pages')
    expect(existsSync(join(outDir, 'index.html'))).toBe(true)
    expect(existsSync(join(outDir, '404.html'))).toBe(true)
    expect(existsSync(join(outDir, '.nojekyll'))).toBe(true)
    expect(existsSync(join(outDir, 'assets', 'style.css'))).toBe(true)
    expect(existsSync(join(outDir, 'assets', 'main.js'))).toBe(true)

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
    const css = readFileSync(join(outDir, 'assets', 'style.css'), 'utf-8')
    const js = readFileSync(join(outDir, 'assets', 'main.js'), 'utf-8')
    expect(html).toContain('Build Test')
    expect(css).toContain('--doc-content-max-width:100ch')
    expect(css).toContain('.doc-content{max-width:var(--doc-content-max-width)')
    expect(css).toContain('.doc-home-section{max-width:var(--doc-content-max-width)')
    expect(css).toContain('.doc-home-content{max-width:var(--doc-content-max-width)')
    expect(css).toContain('.doc-home-footer{max-width:var(--doc-content-max-width)')
    expect(css).toContain('.ps-code-toolbar{')
    expect(css).toContain('.ps-code-language-badge{')
    expect(css).toContain('.ps-code-tabs-ready .ps-code-tabs-nav::-webkit-scrollbar')
    expect(js).toContain('ps-code-tabs-ready')
    expect(js).toContain('data-ps-code-copy')
    expect(css).not.toContain('84ch')
  })

  it('builds in zero-config mode when a docs directory exists', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-zero-config-'))
    mkdirSync(join(rootDir, 'docs'), { recursive: true })

    writeFileSync(
      join(rootDir, 'docs', 'README.md'),
      '# Zero Config\n\nDocs without config.',
      'utf-8',
    )

    await build({ configPath: join(rootDir, 'pagesmith.config.json5') })

    const outDir = join(rootDir, 'gh-pages')
    expect(existsSync(join(outDir, 'index.html'))).toBe(true)

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
    expect(html).toContain('Zero Config')
    expect(html).toContain('Docs without config.')
  })

  it('writes slashless sitemap URLs for basePath routes', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content', 'guide', 'getting-started'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Build Test", origin: "https://example.dev", basePath: "/docs", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'guide', 'getting-started', 'README.md'),
      '# Getting Started\n\nMore docs.',
      'utf-8',
    )

    await build({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' })

    const outDir = join(rootDir, 'gh-pages')
    const sitemap = readFileSync(join(outDir, 'sitemap.xml'), 'utf-8')

    expect(existsSync(join(outDir, 'guide', 'getting-started', 'index.html'))).toBe(true)
    expect(sitemap).toContain('<loc>https://example.dev/docs</loc>')
    expect(sitemap).toContain('<loc>https://example.dev/docs/guide/getting-started</loc>')
    expect(sitemap).not.toContain('<loc>https://example.dev/docs/</loc>')
    expect(sitemap).not.toContain('<loc>https://example.dev/docs/guide/getting-started/</loc>')
  })

  it('preserves example output when rebuilding docs into a shared gh-pages root', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content'), { recursive: true })
    mkdirSync(join(rootDir, 'gh-pages', 'examples', 'nextjs'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Build Test", origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')
    writeFileSync(
      join(rootDir, 'gh-pages', 'examples', 'nextjs', 'index.html'),
      '<h1>Example output</h1>',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'gh-pages', 'stale-doc-file.txt'), 'remove me', 'utf-8')

    await build({ configPath: join(rootDir, 'pagesmith.config.json5') })

    const outDir = join(rootDir, 'gh-pages')
    expect(existsSync(join(outDir, 'index.html'))).toBe(true)
    expect(existsSync(join(outDir, 'examples', 'nextjs', 'index.html'))).toBe(true)
    expect(readFileSync(join(outDir, 'examples', 'nextjs', 'index.html'), 'utf-8')).toContain(
      'Example output',
    )
    expect(existsSync(join(outDir, 'stale-doc-file.txt'))).toBe(false)
  })
})
