import { describe, it, expect, afterEach } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { resolveDocsConfig } from '../config.js'
import {
  toContentSlug,
  collectContentAssets,
  loadRootMeta,
  loadSectionMetas,
  buildBreadcrumbs,
  DocsFrontmatterSchema,
  loadDocsPages,
} from '../content.js'

// ---------------------------------------------------------------------------
// toContentSlug
// ---------------------------------------------------------------------------
describe('toContentSlug', () => {
  const contentDir = 'content'

  it('converts root README.md to /', () => {
    expect(toContentSlug('content/README.md', contentDir)).toBe('/')
  })

  it('converts root index.md to /', () => {
    expect(toContentSlug('content/index.md', contentDir)).toBe('/')
  })

  it('converts nested README.md to section slug', () => {
    expect(toContentSlug('content/guide/getting-started/README.md', contentDir)).toBe(
      'guide/getting-started',
    )
  })

  it('converts a regular nested file to its slug', () => {
    expect(toContentSlug('content/guide/intro.md', contentDir)).toBe('guide/intro')
  })

  it('converts a single-depth file', () => {
    expect(toContentSlug('content/about.md', contentDir)).toBe('about')
  })

  it('handles nested index.md files', () => {
    expect(toContentSlug('content/reference/index.md', contentDir)).toBe('reference')
  })

  it('handles deeply nested paths', () => {
    expect(toContentSlug('content/guide/advanced/configuration/setup.md', contentDir)).toBe(
      'guide/advanced/configuration/setup',
    )
  })

  it('handles deeply nested README.md', () => {
    expect(toContentSlug('content/guide/advanced/README.md', contentDir)).toBe('guide/advanced')
  })
})

// ---------------------------------------------------------------------------
// collectContentAssets
// ---------------------------------------------------------------------------
describe('collectContentAssets', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('finds image files in a flat directory', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    writeFileSync(join(tmpDir, 'logo.png'), '')
    writeFileSync(join(tmpDir, 'icon.svg'), '')
    writeFileSync(join(tmpDir, 'photo.jpg'), '')

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(3)
    expect(assets.byBasename.has('logo.png')).toBe(true)
    expect(assets.byBasename.has('icon.svg')).toBe(true)
    expect(assets.byBasename.has('photo.jpg')).toBe(true)
  })

  it('finds image files in nested directories', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    mkdirSync(join(tmpDir, 'guide'), { recursive: true })
    writeFileSync(join(tmpDir, 'guide', 'diagram.png'), '')
    writeFileSync(join(tmpDir, 'banner.webp'), '')

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(2)
    expect(assets.byPath.has('guide/diagram.png')).toBe(true)
    expect(assets.byBasename.has('banner.webp')).toBe(true)
  })

  it('excludes .md files', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    writeFileSync(join(tmpDir, 'README.md'), '# Hello')
    writeFileSync(join(tmpDir, 'guide.md'), '# Guide')
    writeFileSync(join(tmpDir, 'logo.png'), '')

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(1)
    expect(assets.byBasename.has('README.md')).toBe(false)
    expect(assets.byBasename.has('guide.md')).toBe(false)
    expect(assets.byBasename.has('logo.png')).toBe(true)
  })

  it('excludes non-image files like .txt and .json', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    writeFileSync(join(tmpDir, 'data.json'), '{}')
    writeFileSync(join(tmpDir, 'notes.txt'), 'hello')
    writeFileSync(join(tmpDir, 'image.gif'), '')

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(1)
    expect(assets.byBasename.has('image.gif')).toBe(true)
  })

  it('returns empty maps for an empty directory', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(0)
    expect(assets.byBasename.size).toBe(0)
  })

  it('returns empty maps for a non-existent directory', () => {
    const assets = collectContentAssets('/tmp/__nonexistent_ps_dir__')

    expect(assets.byPath.size).toBe(0)
    expect(assets.byBasename.size).toBe(0)
  })

  it('skips dot-files and dot-directories', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    writeFileSync(join(tmpDir, '.hidden.png'), '')
    mkdirSync(join(tmpDir, '.git'), { recursive: true })
    writeFileSync(join(tmpDir, '.git', 'image.png'), '')
    writeFileSync(join(tmpDir, 'visible.svg'), '')

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(1)
    expect(assets.byBasename.has('visible.svg')).toBe(true)
  })

  it('recognizes all supported image extensions', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-assets-'))
    const extensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico']
    for (const ext of extensions) {
      writeFileSync(join(tmpDir, `file${ext}`), '')
    }

    const assets = collectContentAssets(tmpDir)

    expect(assets.byPath.size).toBe(extensions.length)
  })
})

// ---------------------------------------------------------------------------
// loadRootMeta
// ---------------------------------------------------------------------------
describe('loadRootMeta', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('returns undefined when meta.json5 does not exist', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-rootmeta-'))
    const result = loadRootMeta(tmpDir)

    expect(result).toBeUndefined()
  })

  it('parses meta.json5 when it exists', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-rootmeta-'))
    writeFileSync(
      join(tmpDir, 'meta.json5'),
      '{ displayName: "My Docs", headerLinks: [{ label: "Guide", path: "/guide" }] }',
      'utf-8',
    )

    const result = loadRootMeta(tmpDir)

    expect(result).toBeDefined()
    expect(result!.displayName).toBe('My Docs')
    expect(result!.headerLinks).toHaveLength(1)
    expect(result!.headerLinks![0].label).toBe('Guide')
  })
})

// ---------------------------------------------------------------------------
// loadSectionMetas
// ---------------------------------------------------------------------------
describe('loadSectionMetas', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('returns empty map for non-existent directory', () => {
    const result = loadSectionMetas('/tmp/__nonexistent_ps_dir__')

    expect(result.size).toBe(0)
  })

  it('returns empty map for directory with no section metas', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-secmeta-'))
    mkdirSync(join(tmpDir, 'guide'), { recursive: true })
    // No meta.json5 inside guide/

    const result = loadSectionMetas(tmpDir)

    expect(result.size).toBe(0)
  })

  it('loads section metas from subdirectories', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-secmeta-'))
    mkdirSync(join(tmpDir, 'guide'), { recursive: true })
    writeFileSync(
      join(tmpDir, 'guide', 'meta.json5'),
      '{ displayName: "User Guide", orderBy: "manual" }',
      'utf-8',
    )
    mkdirSync(join(tmpDir, 'reference'), { recursive: true })
    writeFileSync(
      join(tmpDir, 'reference', 'meta.json5'),
      '{ displayName: "API Reference" }',
      'utf-8',
    )

    const result = loadSectionMetas(tmpDir)

    expect(result.size).toBe(2)
    expect(result.get('guide')!.displayName).toBe('User Guide')
    expect(result.get('guide')!.orderBy).toBe('manual')
    expect(result.get('reference')!.displayName).toBe('API Reference')
  })

  it('ignores dot-directories', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-secmeta-'))
    mkdirSync(join(tmpDir, '.hidden'), { recursive: true })
    writeFileSync(join(tmpDir, '.hidden', 'meta.json5'), '{ displayName: "Hidden" }', 'utf-8')

    const result = loadSectionMetas(tmpDir)

    expect(result.size).toBe(0)
  })

  it('ignores underscore-prefixed directories', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-secmeta-'))
    mkdirSync(join(tmpDir, '_hidden'), { recursive: true })
    writeFileSync(join(tmpDir, '_hidden', 'meta.json5'), '{ displayName: "Hidden" }', 'utf-8')

    const result = loadSectionMetas(tmpDir)

    expect(result.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// buildBreadcrumbs
// ---------------------------------------------------------------------------
describe('buildBreadcrumbs', () => {
  it('returns empty array for home page', () => {
    const crumbs = buildBreadcrumbs('/', 'Home', '')

    expect(crumbs).toEqual([])
  })

  it('builds breadcrumbs for a section page', () => {
    const crumbs = buildBreadcrumbs('guide/getting-started', 'Getting Started', '')

    expect(crumbs).toHaveLength(2)
    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/guide' })
    expect(crumbs[1]).toEqual({ label: 'Getting Started', path: '' })
  })

  it('builds breadcrumbs for deeply nested page', () => {
    const crumbs = buildBreadcrumbs('guide/advanced/config', 'Configuration', '')

    expect(crumbs).toHaveLength(3)
    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/guide' })
    expect(crumbs[1]).toEqual({ label: 'Advanced', path: '/guide/advanced' })
    expect(crumbs[2]).toEqual({ label: 'Configuration', path: '' })
  })

  it('includes basePath in crumb paths', () => {
    const crumbs = buildBreadcrumbs('guide/intro', 'Introduction', '/docs')

    expect(crumbs).toHaveLength(2)
    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/docs/guide' })
    expect(crumbs[1]).toEqual({ label: 'Introduction', path: '' })
  })

  it('handles single-depth page', () => {
    const crumbs = buildBreadcrumbs('about', 'About', '')

    // Single-depth: just the current page with no parent crumbs
    expect(crumbs).toHaveLength(1)
    expect(crumbs[0]).toEqual({ label: 'About', path: '' })
  })

  it('uses folderPaths to resolve ancestor links', () => {
    const folderPaths = new Map([['guide', '/guide/getting-started']])
    const crumbs = buildBreadcrumbs('guide/advanced', 'Advanced', '', folderPaths)

    expect(crumbs).toHaveLength(2)
    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/guide/getting-started' })
    expect(crumbs[1]).toEqual({ label: 'Advanced', path: '' })
  })

  it('uses folderPaths for deeply nested ancestors', () => {
    const folderPaths = new Map([
      ['guide', '/docs/guide/intro'],
      ['guide/advanced', '/docs/guide/advanced/setup'],
    ])
    const crumbs = buildBreadcrumbs('guide/advanced/config', 'Configuration', '/docs', folderPaths)

    expect(crumbs).toHaveLength(3)
    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/docs/guide/intro' })
    expect(crumbs[1]).toEqual({ label: 'Advanced', path: '/docs/guide/advanced/setup' })
    expect(crumbs[2]).toEqual({ label: 'Configuration', path: '' })
  })

  it('falls back to slug-based path when folder is not in map', () => {
    const folderPaths = new Map([['guide', '/guide/intro']])
    const crumbs = buildBreadcrumbs('guide/advanced/config', 'Configuration', '', folderPaths)

    expect(crumbs[0]).toEqual({ label: 'Guide', path: '/guide/intro' })
    expect(crumbs[1]).toEqual({ label: 'Advanced', path: '/guide/advanced' })
  })
})

// ---------------------------------------------------------------------------
// DocsFrontmatterSchema — draft filtering
// ---------------------------------------------------------------------------
describe('DocsFrontmatterSchema', () => {
  it('parses minimal frontmatter (empty object)', () => {
    const result = DocsFrontmatterSchema.parse({})

    expect(result.draft).toBeUndefined()
    expect(result.title).toBeUndefined()
  })

  it('parses frontmatter with draft flag', () => {
    const result = DocsFrontmatterSchema.parse({ draft: true })

    expect(result.draft).toBe(true)
  })

  it('passes through unknown fields', () => {
    const result = DocsFrontmatterSchema.parse({
      title: 'Test',
      customField: 'custom value',
    })

    expect(result.title).toBe('Test')
    expect((result as any).customField).toBe('custom value')
  })

  it('parses all known frontmatter fields', () => {
    const result = DocsFrontmatterSchema.parse({
      title: 'My Page',
      description: 'A test page',
      navLabel: 'Page',
      sidebarLabel: 'Side Label',
      order: 5,
      draft: false,
      socialImage: '/images/og.png',
    })

    expect(result.title).toBe('My Page')
    expect(result.description).toBe('A test page')
    expect(result.navLabel).toBe('Page')
    expect(result.sidebarLabel).toBe('Side Label')
    expect(result.order).toBe(5)
    expect(result.draft).toBe(false)
    expect(result.socialImage).toBe('/images/og.png')
  })

  it('parses home page frontmatter fields', () => {
    const result = DocsFrontmatterSchema.parse({
      title: 'Home',
      tagline: 'Ship docs faster',
      badge: 'Stable',
      install: 'npm add @pagesmith/docs',
      actions: [{ text: 'Get Started', link: '/guide/getting-started', theme: 'brand' }],
      hero: {
        name: 'Acme',
        text: 'Acme Docs',
        tagline: 'Ship docs faster',
      },
      features: [{ title: 'Fast setup', details: 'Bootstrap docs from the repo itself.' }],
      packages: [{ name: '@acme/core', description: 'Main package', href: '/reference/api' }],
      codeExample: {
        label: 'Install',
        title: 'Getting started',
        code: 'npm add @pagesmith/docs',
      },
    })

    expect(result.tagline).toBe('Ship docs faster')
    expect(result.badge).toBe('Stable')
    expect(result.install).toBe('npm add @pagesmith/docs')
    expect(result.actions?.[0]?.theme).toBe('brand')
    expect(result.codeExample?.label).toBe('Install')
  })
})

describe('loadDocsPages', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('rewrites markdown links and asset references during markdown processing', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-pages-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ basePath: "/docs", origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'guide', 'intro.md'),
      ['# Intro', '', '[Home](../README.md)', '', '![Diagram](./diagram.png)'].join('\n'),
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'guide', 'diagram.png'), 'png', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    expect(config.basePath).toBe('/docs')
    const pages = await loadDocsPages(config)
    const intro = pages.find((page) => page.contentSlug === 'guide/intro')

    expect(intro).toBeDefined()
    expect(intro!.html).toContain('href="/docs/"')
    expect(intro!.html).toContain('src="/assets/diagram.png"')
  })

  it('does not inline SVG files outside the page directory subtree', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-pages-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'secret.inline.svg'),
      '<svg><text>secret</text></svg>',
      'utf-8',
    )
    writeFileSync(
      join(rootDir, 'content', 'guide', 'local.inline.svg'),
      '<svg><text>local</text></svg>',
      'utf-8',
    )
    writeFileSync(
      join(rootDir, 'content', 'guide', 'intro.md'),
      ['# Intro', '', '![Inline](./local.inline.svg)', '![Escape](./../../secret.inline.svg)'].join(
        '\n',
      ),
      'utf-8',
    )

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    const pages = await loadDocsPages(config)
    const intro = pages.find((page) => page.contentSlug === 'guide/intro')

    expect(intro).toBeDefined()
    expect(intro!.html).toContain('class="inline-svg"')
    expect(intro!.html).toContain('local')
    expect(intro!.html).toContain('src="/assets/secret.inline.svg"')
    expect(intro!.html).not.toContain('<text>secret</text>')
  })

  it('uses zero-config docs conventions and ignores underscore-prefixed markdown', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-pages-'))
    mkdirSync(join(rootDir, 'docs', 'guide', 'deep'), { recursive: true })
    mkdirSync(join(rootDir, 'docs', '_partials'), { recursive: true })

    writeFileSync(join(rootDir, 'docs', 'README.md'), '# Home\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', 'about.md'), '# About\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', '_draft.md'), '# Draft\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', '_partials', 'hidden.md'), '# Hidden\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', 'guide', 'README.md'), '# Guide\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', 'guide', 'intro.md'), '# Intro\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', 'guide', '_hidden.md'), '# Hidden\n', 'utf-8')
    writeFileSync(join(rootDir, 'docs', 'guide', 'deep', 'setup.md'), '# Setup\n', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    const pages = await loadDocsPages(config)

    expect(config.contentDir).toBe(join(rootDir, 'docs'))
    expect(pages.map((page) => page.contentSlug)).toEqual([
      '/',
      'about',
      'guide',
      'guide/deep/setup',
      'guide/intro',
    ])
    expect(pages.find((page) => page.contentSlug === 'about')?.section).toBeUndefined()
    expect(pages.find((page) => page.contentSlug === 'guide')?.section).toBe('guide')
    expect(pages.find((page) => page.contentSlug === 'guide/deep/setup')?.section).toBe('guide')
  })
})
