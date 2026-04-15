import { afterEach, describe, expect, it } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { collectContentAssets, emitGeneratedImageVariants, type ContentAssetMap } from '../assets'

describe('content companion assets', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir) {
      rmSync(rootDir, { recursive: true, force: true })
      rootDir = ''
    }
  })

  it('collects nested asset keys with POSIX separators', () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-assets-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(join(contentDir, 'guide'), { recursive: true })
    writeFileSync(join(contentDir, 'guide', 'diagram.png'), '')

    const assets = collectContentAssets([contentDir])

    expect(Array.from(assets.byPath.keys())).toEqual(['guide/diagram.png'])
    expect(assets.byBasename.get('diagram.png')).toEqual(['guide/diagram.png'])
  })

  it('throws when multiple content roots publish the same relative asset path', () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-assets-'))
    const contentA = join(rootDir, 'content-a')
    const contentB = join(rootDir, 'content-b')
    mkdirSync(join(contentA, 'guide'), { recursive: true })
    mkdirSync(join(contentB, 'guide'), { recursive: true })
    writeFileSync(join(contentA, 'guide', 'diagram.png'), 'a')
    writeFileSync(join(contentB, 'guide', 'diagram.png'), 'b')

    expect(() => collectContentAssets([contentA, contentB])).toThrow(
      'duplicate companion asset path "guide/diagram.png"',
    )
  })

  it('warns and skips generated variants when image conversion fails', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-core-assets-'))
    const outDir = join(rootDir, 'out')
    const brokenPath = join(rootDir, 'broken.jpg')
    writeFileSync(brokenPath, 'not-a-real-jpeg', 'utf-8')

    const assets: ContentAssetMap = {
      byPath: new Map([['guide/broken.jpg', brokenPath]]),
      byBasename: new Map([['broken.jpg', ['guide/broken.jpg']]]),
    }

    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(' '))
    }

    try {
      await expect(emitGeneratedImageVariants(outDir, assets)).resolves.toBeUndefined()
    } finally {
      console.warn = originalWarn
    }

    expect(existsSync(join(outDir, 'guide', 'broken.avif'))).toBe(false)
    expect(existsSync(join(outDir, 'guide', 'broken.webp'))).toBe(false)
    expect(warnings.some((w) => w.includes('failed to emit') && w.includes('avif'))).toBe(true)
    expect(warnings.some((w) => w.includes('failed to emit') && w.includes('webp'))).toBe(true)
  })
})
