import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { validateContent } from '../validation/content-validator'
import { z } from 'zod'

describe('validateContent', () => {
  const tempDirs: string[] = []

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ps-content-val-'))
    tempDirs.push(dir)
    return dir
  }

  afterEach(() => {
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
    tempDirs.length = 0
  })

  it('returns zero issues for clean content', async () => {
    const dir = makeTempDir()
    writeFileSync(
      join(dir, 'ok.md'),
      ['---', 'title: OK', '---', '', '# Heading', '', 'Some text.', ''].join('\n'),
    )

    const summary = await validateContent({ contentDir: dir })
    expect(summary.fileCount).toBe(1)
    expect(summary.errors).toBe(0)
  })

  it('reports broken internal links against rootDir + basePath', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.md'), '# A\n\n[Missing](/does-not-exist)\n')

    const summary = await validateContent({
      contentDir: dir,
      linkValidator: { rootDir: dir, basePath: '/site' },
    })
    expect(summary.errors).toBeGreaterThan(0)
    const allIssues = summary.results.flatMap((r) => r.issues)
    expect(allIssues.some((i) => i.message.includes('/does-not-exist'))).toBe(true)
  })

  it('resolves site-absolute paths via additionalRoots', async () => {
    const content = makeTempDir()
    const publicDir = makeTempDir()
    writeFileSync(join(publicDir, 'favicon.svg'), '<svg/>')
    writeFileSync(join(content, 'a.md'), '# A\n\n![Logo](/favicon.svg)\n')

    const summary = await validateContent({
      contentDir: content,
      linkValidator: {
        rootDir: content,
        additionalRoots: [{ prefix: '/', dir: publicDir }],
      },
    })
    expect(summary.errors).toBe(0)
  })

  it('reports frontmatter schema failures', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.md'), '---\ntitle: 42\n---\n\n# H\n\nbody\n')

    const summary = await validateContent({
      contentDir: dir,
      frontmatterSchema: z.object({ title: z.string() }),
    })
    expect(summary.errors).toBeGreaterThan(0)
    const schemaIssues = summary.results
      .flatMap((r) => r.issues)
      .filter((i) => i.source === 'schema')
    expect(schemaIssues.length).toBeGreaterThan(0)
  })

  it('does not flag link text that is only an inline code span', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'a.md'), '# H\n\n[`npm install`](https://npmjs.com)\n')

    const summary = await validateContent({ contentDir: dir })
    const textIssues = summary.results
      .flatMap((r) => r.issues)
      .filter((i) => i.message.includes('no visible text'))
    expect(textIssues).toEqual([])
  })

  it('does not flag linked images that only contain an image with alt text', async () => {
    const dir = makeTempDir()
    mkdirSync(join(dir, 'sub'), { recursive: true })
    writeFileSync(join(dir, 'sub', 'icon.svg'), '<svg/>')
    writeFileSync(join(dir, 'a.md'), '# H\n\n[![Alt text](./sub/icon.svg)](https://example.com)\n')

    const summary = await validateContent({ contentDir: dir })
    const textIssues = summary.results
      .flatMap((r) => r.issues)
      .filter((i) => i.message.includes('no visible text'))
    expect(textIssues).toEqual([])
  })

  it('flags images that lack alt text as errors', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'icon.svg'), '<svg/>')
    writeFileSync(join(dir, 'a.md'), '# H\n\n![](./icon.svg)\n')

    const summary = await validateContent({ contentDir: dir })
    expect(summary.errors).toBeGreaterThan(0)
    const issues = summary.results.flatMap((r) => r.issues)
    expect(issues.some((i) => i.message.includes('missing alt text'))).toBe(true)
  })

  it('flags raw <img> tags in markdown but allows <img> inside <picture>', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'light.svg'), '<svg/>')
    writeFileSync(join(dir, 'dark.svg'), '<svg/>')
    writeFileSync(join(dir, 'bad.md'), '# H\n\n<img src="./light.svg" alt="raw">\n')
    writeFileSync(
      join(dir, 'ok.md'),
      '# H\n\n<picture>\n  <source srcset="./dark.svg" media="(prefers-color-scheme: dark)">\n  <img src="./light.svg" alt="ok">\n</picture>\n',
    )

    const summary = await validateContent({ contentDir: dir })
    const bad = summary.results.find((r) => r.relativePath === 'bad.md')!
    const ok = summary.results.find((r) => r.relativePath === 'ok.md')!
    expect(bad.issues.some((i) => i.message.includes('Raw <img>'))).toBe(true)
    expect(ok.issues.some((i) => i.message.includes('Raw <img>'))).toBe(false)
  })

  it('enforces adjacent -light/-dark image pairs', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'hero-light.svg'), '<svg/>')
    writeFileSync(join(dir, 'hero-dark.svg'), '<svg/>')
    writeFileSync(join(dir, 'orphan-light.svg'), '<svg/>')
    writeFileSync(
      join(dir, 'paired.md'),
      '# H\n\n![light](./hero-light.svg)\n![dark](./hero-dark.svg)\n',
    )
    writeFileSync(
      join(dir, 'orphan.md'),
      '# H\n\nText in between.\n\n![orphan](./orphan-light.svg)\n\nMore text.\n',
    )

    const summary = await validateContent({ contentDir: dir })
    const paired = summary.results.find((r) => r.relativePath === 'paired.md')!
    const orphan = summary.results.find((r) => r.relativePath === 'orphan.md')!
    expect(paired.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(orphan.issues.some((i) => i.message.includes('Missing dark partner'))).toBe(true)
  })

  it('accepts .invert single-entry images without demanding a pair', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'logo.invert.svg'), '<svg/>')
    writeFileSync(join(dir, 'a.md'), '# H\n\n![Logo](./logo.invert.svg)\n')

    const summary = await validateContent({ contentDir: dir })
    const issues = summary.results.flatMap((r) => r.issues)
    expect(issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('enforces internalLinksMustBeMarkdown for link nodes', async () => {
    const dir = makeTempDir()
    writeFileSync(join(dir, 'other.md'), '# other\n')
    writeFileSync(join(dir, 'asset.svg'), '<svg/>')
    writeFileSync(join(dir, 'a.md'), '# H\n\n[ok](./other.md)\n\n[bad](./asset.svg)\n')

    const summary = await validateContent({
      contentDir: dir,
      linkValidator: { internalLinksMustBeMarkdown: true },
    })
    const issues = summary.results.flatMap((r) => r.issues)
    expect(issues.some((i) => i.message.includes('must point to a markdown'))).toBe(true)
  })

  it('resolves bare-slug internal links to README.md', async () => {
    const content = makeTempDir()
    mkdirSync(join(content, 'guide', 'foo'), { recursive: true })
    writeFileSync(join(content, 'guide', 'foo', 'README.md'), '---\ntitle: Foo\n---\n\n# Foo\n')
    writeFileSync(join(content, 'a.md'), '# H\n\n[Foo](/guide/foo)\n')

    const summary = await validateContent({
      contentDir: content,
      linkValidator: { rootDir: content, internalLinksMustBeMarkdown: true },
    })
    expect(summary.errors).toBe(0)
  })
})
