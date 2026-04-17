import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { validateBuildOutput } from './build-validator.js'

describe('validateBuildOutput', () => {
  const tempDirs: string[] = []

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ps-build-validate-'))
    tempDirs.push(dir)
    return dir
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.length = 0
  })

  it('returns error when output directory does not exist', () => {
    const result = validateBuildOutput({ outDir: '/tmp/nonexistent-ps-test-dir' })
    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]!.message).toContain('does not exist')
  })

  it('passes for a valid build with hashed images', () => {
    const outDir = makeTempDir()
    mkdirSync(join(outDir, 'assets'), { recursive: true })
    writeFileSync(
      join(outDir, 'assets', 'logo.a1b2c3d4.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
    )
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><head></head><body><img src="/assets/logo.a1b2c3d4.svg"></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.htmlFileCount).toBe(1)
    expect(result.imageFileCount).toBe(1)
  })

  it('detects broken internal links', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><head></head><body><a href="/about">About</a></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('Broken href: /about'))).toBe(true)
  })

  it('resolves flat HTML files when trailingSlash is false', () => {
    const outDir = makeTempDir()
    writeFileSync(join(outDir, 'about.html'), '<!DOCTYPE html><html><body>About</body></html>')
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><a href="/about">About</a></body></html>',
    )

    const result = validateBuildOutput({ outDir, trailingSlash: false })
    expect(result.passed).toBe(true)
  })

  it('resolves directory index files when trailingSlash is true', () => {
    const outDir = makeTempDir()
    mkdirSync(join(outDir, 'about'), { recursive: true })
    writeFileSync(
      join(outDir, 'about', 'index.html'),
      '<!DOCTYPE html><html><body>About</body></html>',
    )
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><a href="/about">About</a></body></html>',
    )

    const result = validateBuildOutput({ outDir, trailingSlash: true })
    expect(result.passed).toBe(true)
  })

  it('strips basePath before resolving links', () => {
    const outDir = makeTempDir()
    writeFileSync(join(outDir, 'about.html'), '<!DOCTYPE html><html><body>About</body></html>')
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><a href="/docs/about">About</a></body></html>',
    )

    const result = validateBuildOutput({ outDir, basePath: '/docs' })
    expect(result.passed).toBe(true)
  })

  it('reports unhashed images in assets/', () => {
    const outDir = makeTempDir()
    mkdirSync(join(outDir, 'assets'), { recursive: true })
    writeFileSync(
      join(outDir, 'assets', 'logo.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
    )
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('missing content hash'))).toBe(true)
  })

  it('detects broken image src', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><img src="/assets/missing.a1b2c3d4.png"></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('Broken src'))).toBe(true)
  })

  it('detects broken srcset entries', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><img srcset="/assets/img.a1b2c3d4.png 1x, /assets/img2.deadbeef.png 2x"></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('Broken srcset entry'))).toBe(true)
  })

  it('detects invalid SVG files', () => {
    const outDir = makeTempDir()
    mkdirSync(join(outDir, 'assets'), { recursive: true })
    writeFileSync(
      join(outDir, 'assets', 'bad.a1b2c3d4.svg'),
      '<html><parsererror>bad</parsererror></html>',
    )
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('does not contain an <svg> element'))).toBe(
      true,
    )
  })

  it('validates valid SVG files pass', () => {
    const outDir = makeTempDir()
    mkdirSync(join(outDir, 'assets'), { recursive: true })
    writeFileSync(
      join(outDir, 'assets', 'icon.a1b2c3d4.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
    )
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(true)
  })

  it('skips external URLs', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><a href="https://example.com">Link</a><a href="mailto:a@b.com">Mail</a></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(true)
  })

  it('skips links inside code blocks', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body><pre><code>href="/nonexistent"</code></pre></body></html>',
    )

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(true)
  })

  it('skips redirect HTML files', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'old.html'),
      '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/new"></head><body></body></html>',
    )
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')

    const result = validateBuildOutput({ outDir })
    expect(result.passed).toBe(true)
  })

  it('detects broken in-page anchors when checkInPageAnchors is enabled', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body>' +
        '<h2 id="intro">Intro</h2>' +
        '<a href="#intro">Intro</a>' +
        '<a href="#missing">Missing</a>' +
        '</body></html>',
    )

    const permissive = validateBuildOutput({ outDir })
    expect(permissive.passed).toBe(true)

    const strict = validateBuildOutput({ outDir, checkInPageAnchors: true })
    expect(strict.passed).toBe(false)
    expect(strict.errors.some((e) => e.message.includes('#missing'))).toBe(true)
    expect(strict.errors.some((e) => e.message.includes('#intro'))).toBe(false)
  })

  it('warns when themed picture elements miss a theme variant', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body>' +
        '<figure class="ps-figure-themed"><picture>' +
        '<source srcset="/a-light.svg" data-scheme="light">' +
        '<img src="/a-light.svg" alt="">' +
        '</picture></figure></body></html>',
    )
    writeFileSync(
      join(outDir, 'a-light.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
    )

    const result = validateBuildOutput({
      outDir,
      requireThemeVariants: true,
      requireAssetHash: false,
    })
    expect(result.warnings.some((w) => w.message.includes('dark variant'))).toBe(true)
  })

  it('reports missing required output files', () => {
    const outDir = makeTempDir()
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')

    const result = validateBuildOutput({
      outDir,
      requiredFiles: [['favicon.svg', 'favicon.ico'], 'sitemap.xml', 'robots.txt'],
    })
    expect(result.passed).toBe(false)
    expect(result.errors.some((e) => e.message.includes('favicon.svg | favicon.ico'))).toBe(true)
    expect(result.errors.some((e) => e.message.includes('sitemap.xml'))).toBe(true)
    expect(result.errors.some((e) => e.message.includes('robots.txt'))).toBe(true)
  })

  it('passes required-file check when an alternative exists', () => {
    const outDir = makeTempDir()
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body></body></html>')
    writeFileSync(join(outDir, 'favicon.ico'), 'x')
    writeFileSync(join(outDir, 'sitemap.xml'), '<urlset/>')
    writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\n')

    const result = validateBuildOutput({
      outDir,
      requiredFiles: [['favicon.svg', 'favicon.ico'], 'sitemap.xml', 'robots.txt'],
    })
    expect(result.passed).toBe(true)
  })

  it('warns when both trailing-slash forms are not available', () => {
    const outDir = makeTempDir()
    writeFileSync(join(outDir, 'about.html'), '<!DOCTYPE html><html><body>About</body></html>')
    writeFileSync(join(outDir, 'index.html'), '<!DOCTYPE html><html><body>Home</body></html>')

    const result = validateBuildOutput({ outDir, requireBothTrailingSlashForms: true })
    expect(result.warnings.some((w) => w.message.includes('trailing-slash alternative'))).toBe(true)
  })

  it('warns when raster pictures miss modern formats', () => {
    const outDir = makeTempDir()
    writeFileSync(
      join(outDir, 'index.html'),
      '<!DOCTYPE html><html><body>' +
        '<picture>' +
        '<source srcset="/hero.png" type="image/png">' +
        '<img src="/hero.png" alt="">' +
        '</picture></body></html>',
    )
    writeFileSync(join(outDir, 'hero.png'), 'x')

    const result = validateBuildOutput({
      outDir,
      requireRasterModernFormats: true,
      requireAssetHash: false,
    })
    expect(result.warnings.some((w) => w.message.includes('webp'))).toBe(true)
    expect(result.warnings.some((w) => w.message.includes('avif'))).toBe(true)
  })
})
