import { afterEach, describe, expect, it } from 'vite-plus/test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import sharp from 'sharp'
import { build, rebuildContent } from '../build.js'

function expectCaptured(value: string, pattern: RegExp): string {
  const match = value.match(pattern)
  expect(match).toBeTruthy()
  return match![1]
}

function findHashedAsset(outDir: string, prefix: string, ext: string): string {
  const assetFile = readdirSync(join(outDir, 'assets')).find((file) =>
    new RegExp(`^${prefix}\\.[a-f0-9]{8}\\${ext}$`).test(file),
  )
  expect(assetFile).toBeDefined()
  return assetFile!
}

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

    const styleAsset = findHashedAsset(outDir, 'style', '.css')
    const mainAsset = findHashedAsset(outDir, 'main', '.js')
    expect(existsSync(join(outDir, 'assets', 'style.css'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'main.js'))).toBe(false)

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
    const css = readFileSync(join(outDir, 'assets', styleAsset), 'utf-8')
    const js = readFileSync(join(outDir, 'assets', mainAsset), 'utf-8')
    expect(html).toContain('Build Test')
    expect(html).toContain(`/docs/assets/${styleAsset}`)
    expect(html).toContain(`/docs/assets/${mainAsset}`)
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

  it('fails content-only rebuilds when config validation reports errors', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      [
        '{',
        '  name: "Build Test",',
        '  origin: "https://example.dev",',
        '  contentDir: "./missing-content"',
        '}',
      ].join('\n'),
      'utf-8',
    )

    await expect(
      rebuildContent({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' }),
    ).rejects.toThrow('Config validation failed')
  })

  it('fails builds when Pagefind indexing errors with search enabled', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      [
        '{',
        '  name: "Build Test",',
        '  origin: "https://example.dev",',
        '  search: { enabled: true, pagefindFlags: ["--definitely-invalid-pagefind-flag"] },',
        '}',
      ].join('\n'),
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')

    await expect(
      build({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' }),
    ).rejects.toThrow(/pagefind/i)
  })

  it('hashes raw HTML figure assets and keeps hashed references after content rebuilds', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Build Test", origin: "https://example.dev", basePath: "/docs", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'guide', 'intro.md'),
      [
        '# Intro',
        '',
        '<figure>',
        '  <img src="./diagram-light.svg" class="only-light" alt="Light diagram">',
        '  <img src="./diagram-dark.svg" class="only-dark" alt="Dark diagram">',
        '</figure>',
      ].join('\n'),
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'guide', 'diagram-light.svg'), '<svg />', 'utf-8')
    writeFileSync(join(rootDir, 'content', 'guide', 'diagram-dark.svg'), '<svg />', 'utf-8')

    await build({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' })

    const outDir = join(rootDir, 'gh-pages')
    const pagePath = join(outDir, 'guide', 'intro.html')
    let html = readFileSync(pagePath, 'utf-8')
    const lightAsset = expectCaptured(
      html,
      /src="\/docs\/assets\/(diagram-light\.[a-f0-9]{8}\.svg)"/,
    )
    const darkAsset = expectCaptured(html, /src="\/docs\/assets\/(diagram-dark\.[a-f0-9]{8}\.svg)"/)

    expect(html).toContain('<figure>')
    expect(existsSync(join(outDir, 'assets', lightAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', darkAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', 'diagram-light.svg'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'diagram-dark.svg'))).toBe(false)

    writeFileSync(
      join(rootDir, 'content', 'guide', 'intro.md'),
      [
        '# Intro',
        '',
        'Updated docs content.',
        '',
        '<figure>',
        '  <img src="./diagram-light.svg" class="only-light" alt="Light diagram">',
        '  <img src="./diagram-dark.svg" class="only-dark" alt="Dark diagram">',
        '</figure>',
      ].join('\n'),
      'utf-8',
    )

    await rebuildContent({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' })

    html = readFileSync(pagePath, 'utf-8')
    expect(html).toContain('Updated docs content.')
    expect(html).toContain(`/docs/assets/${lightAsset}`)
    expect(html).toContain(`/docs/assets/${darkAsset}`)
    expect(html).not.toContain('/docs/assets/style.css')
    expect(html).not.toContain('/docs/assets/main.js')
  })

  it('emits hashed avif and webp fallbacks for local JPEG markdown images', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-build-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Build Test", origin: "https://example.dev", basePath: "/docs", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nBuild test.', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'guide', 'intro.md'),
      '# Intro\n\n![Hero image](./hero.jpg)\n',
      'utf-8',
    )

    await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 3,
        background: '#0088ff',
      },
    })
      .jpeg()
      .toFile(join(rootDir, 'content', 'guide', 'hero.jpg'))

    await build({ configPath: join(rootDir, 'pagesmith.config.json5'), basePath: '/docs' })

    const outDir = join(rootDir, 'gh-pages')
    const pagePath = join(outDir, 'guide', 'intro.html')
    const html = readFileSync(pagePath, 'utf-8')

    const avifAsset = expectCaptured(html, /srcset="\/docs\/assets\/(hero\.[a-f0-9]{8}\.avif)"/)
    const webpAsset = expectCaptured(html, /srcset="\/docs\/assets\/(hero\.[a-f0-9]{8}\.webp)"/)
    // Fallback img src now uses webp variant
    const imgWebpAsset = expectCaptured(
      html,
      /src="\/docs\/assets\/(hero\.[a-f0-9]{8}\.webp)" alt="Hero image"/,
    )

    expect(html).toContain('<picture>')
    expect(html).toContain('<figure')
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('type="image/webp"')
    expect(existsSync(join(outDir, 'assets', avifAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', webpAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', imgWebpAsset))).toBe(true)
    // Original JPEG should not be in output (unhashed or hashed)
    expect(existsSync(join(outDir, 'assets', 'hero.jpg'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'hero.avif'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'hero.webp'))).toBe(false)
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

    expect(existsSync(join(outDir, 'guide', 'getting-started.html'))).toBe(true)
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
