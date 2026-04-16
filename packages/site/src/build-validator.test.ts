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
})
