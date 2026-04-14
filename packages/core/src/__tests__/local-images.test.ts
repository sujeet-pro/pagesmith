import { afterEach, describe, expect, it } from 'vite-plus/test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import { convert } from '../convert'
import { processMarkdown } from '../markdown/pipeline'

describe('local image markdown enhancements', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir) {
      rmSync(rootDir, { recursive: true, force: true })
      rootDir = ''
    }
  })

  it('adds intrinsic dimensions and picture sources for local JPEG images', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(contentDir, { recursive: true })

    const markdownPath = join(contentDir, 'post.md')
    const imagePath = join(contentDir, 'hero.jpg')
    writeFileSync(markdownPath, '![Hero](./hero.jpg)\n', 'utf-8')

    await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: '#ff0066',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await processMarkdown('![Hero](./hero.jpg)', undefined, {
      content: '![Hero](./hero.jpg)',
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
      },
    })

    expect(result.html).toContain('<picture>')
    expect(result.html).toContain('srcset="./hero.avif"')
    expect(result.html).toContain('type="image/avif"')
    expect(result.html).toContain('srcset="./hero.webp"')
    expect(result.html).toContain('type="image/webp"')
    expect(result.html).toContain('<img src="./hero.jpg" alt="Hero" width="40" height="20">')
  })

  it('derives SVG intrinsic dimensions from viewBox for raw html img tags', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(contentDir, { recursive: true })

    const markdownPath = join(contentDir, 'icons.md')
    const imagePath = join(contentDir, 'icon.svg')
    writeFileSync(markdownPath, '<img src="./icon.svg" alt="Icon">\n', 'utf-8')
    writeFileSync(
      imagePath,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="#111"/></svg>',
      'utf-8',
    )

    const result = await processMarkdown('<img src="./icon.svg" alt="Icon">', undefined, {
      content: '<img src="./icon.svg" alt="Icon">',
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
      },
    })

    expect(result.html).toContain('<img src="./icon.svg" alt="Icon" width="120" height="60">')
    expect(result.html).not.toContain('<picture>')
  })

  it('lets convert() reuse local image enhancements when sourcePath is provided', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(contentDir, { recursive: true })

    const markdownPath = join(contentDir, 'post.md')
    const imagePath = join(contentDir, 'hero.jpg')

    await sharp({
      create: {
        width: 48,
        height: 24,
        channels: 3,
        background: '#00aa66',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await convert('![Hero](./hero.jpg)', { sourcePath: markdownPath })

    expect(result.html).toContain('<picture>')
    expect(result.html).toContain('srcset="./hero.avif"')
    expect(result.html).toContain('srcset="./hero.webp"')
    expect(result.html).toContain('<img src="./hero.jpg" alt="Hero" width="48" height="24">')
  })

  it('lets convert() match entry-style parent refs when assetRoot is provided', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    const guideDir = join(contentDir, 'guide')
    const sharedDir = join(contentDir, 'shared')
    mkdirSync(guideDir, { recursive: true })
    mkdirSync(sharedDir, { recursive: true })

    const markdownPath = join(guideDir, 'post.md')
    const imagePath = join(sharedDir, 'hero.jpg')

    await sharp({
      create: {
        width: 52,
        height: 26,
        channels: 3,
        background: '#1144aa',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await convert('![Hero](../shared/hero.jpg)', {
      sourcePath: markdownPath,
      assetRoot: contentDir,
    })

    expect(result.html).toContain('srcset="../shared/hero.avif"')
    expect(result.html).toContain(
      '<img src="../shared/hero.jpg" alt="Hero" width="52" height="26">',
    )
  })

  it('treats bare relative image filenames as local refs', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(contentDir, { recursive: true })

    const markdownPath = join(contentDir, 'post.md')
    const imagePath = join(contentDir, 'hero.jpg')

    await sharp({
      create: {
        width: 36,
        height: 18,
        channels: 3,
        background: '#008866',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await processMarkdown('![Hero](hero.jpg)', undefined, {
      content: '![Hero](hero.jpg)',
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
      },
    })

    expect(result.html).toContain('<picture>')
    expect(result.html).toContain('srcset="hero.avif"')
    expect(result.html).toContain('<img src="hero.jpg" alt="Hero" width="36" height="18">')
  })

  it('allows parent-directory image refs when they stay inside the declared asset root', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    const guideDir = join(contentDir, 'guide')
    const sharedDir = join(contentDir, 'shared')
    mkdirSync(guideDir, { recursive: true })
    mkdirSync(sharedDir, { recursive: true })

    const markdownPath = join(guideDir, 'post.md')
    const imagePath = join(sharedDir, 'hero.jpg')

    await sharp({
      create: {
        width: 64,
        height: 32,
        channels: 3,
        background: '#3355ff',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await processMarkdown('![Hero](../shared/hero.jpg)', undefined, {
      content: '![Hero](../shared/hero.jpg)',
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
        pagesmithAssetRoot: contentDir,
      },
    })

    expect(result.html).toContain('srcset="../shared/hero.avif"')
    expect(result.html).toContain(
      '<img src="../shared/hero.jpg" alt="Hero" width="64" height="32">',
    )
  })

  it('does not resolve image refs that escape the declared asset root', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    const guideDir = join(contentDir, 'guide')
    const outsideDir = join(rootDir, 'outside')
    mkdirSync(guideDir, { recursive: true })
    mkdirSync(outsideDir, { recursive: true })

    const markdownPath = join(guideDir, 'post.md')
    const imagePath = join(outsideDir, 'secret.jpg')

    await sharp({
      create: {
        width: 50,
        height: 25,
        channels: 3,
        background: '#222222',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await processMarkdown('![Secret](../../outside/secret.jpg)', undefined, {
      content: '![Secret](../../outside/secret.jpg)',
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
        pagesmithAssetRoot: contentDir,
      },
    })

    expect(result.html).not.toContain('<picture>')
    expect(result.html).not.toContain('width="50"')
    expect(result.html).toContain('src="../../outside/secret.jpg"')
  })

  it('only skips picture wrapping for raw html images already inside a picture element', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-images-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(contentDir, { recursive: true })

    const markdownPath = join(contentDir, 'post.md')
    const imagePath = join(contentDir, 'hero.jpg')

    await sharp({
      create: {
        width: 44,
        height: 22,
        channels: 3,
        background: '#aa5500',
      },
    })
      .jpeg()
      .toFile(imagePath)

    const result = await processMarkdown(
      '<picture><img src="./hero.jpg" alt="Inside"></picture>\n<img src="./hero.jpg" alt="Outside">',
      undefined,
      {
        content:
          '<picture><img src="./hero.jpg" alt="Inside"></picture>\n<img src="./hero.jpg" alt="Outside">',
        frontmatter: {},
        fileData: {
          pagesmithFilePath: markdownPath,
        },
      },
    )

    expect(result.html.match(/<picture>/g) ?? []).toHaveLength(2)
    expect(result.html).toContain('<img src="./hero.jpg" alt="Inside" width="44" height="22">')
    expect(result.html).toContain('<img src="./hero.jpg" alt="Outside" width="44" height="22">')
  })
})
