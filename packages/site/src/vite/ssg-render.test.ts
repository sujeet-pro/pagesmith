import { afterEach, describe, expect, it } from 'vite-plus/test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ContentAssetMap } from '../assets/index.js'
import { discoverBuiltAssets, rewriteContentAssetRefs } from './ssg-render'

function makeAssetMap(entries: string[]): ContentAssetMap {
  return {
    byPath: new Map(entries.map((entry) => [entry, `/tmp/${entry}`])),
    byBasename: new Map(entries.map((entry) => [entry.split('/').pop() ?? entry, [entry]])),
  }
}

describe('rewriteContentAssetRefs', () => {
  it('rewrites generated avif and webp picture sources beside the source JPEG', () => {
    const html = [
      '<picture>',
      '  <source srcset="./hero.avif" type="image/avif">',
      '  <source srcset="./hero.webp" type="image/webp">',
      '  <img src="./hero.jpg" alt="Hero" width="64" height="32">',
      '</picture>',
    ].join('')

    const rewritten = rewriteContentAssetRefs(
      html,
      '/docs',
      makeAssetMap(['guide/hero.jpg']),
      'guide/intro',
    )

    expect(rewritten).toContain('srcset="/docs/assets/guide/hero.avif"')
    expect(rewritten).toContain('srcset="/docs/assets/guide/hero.webp"')
    expect(rewritten).toContain('src="/docs/assets/guide/hero.jpg"')
  })

  it('uses the route path itself for landing-page sibling assets', () => {
    const rewritten = rewriteContentAssetRefs(
      '<img src="./diagram.jpg" alt="Diagram">',
      '/docs',
      makeAssetMap(['guide/diagram.jpg']),
      'guide',
    )

    expect(rewritten).toContain('src="/docs/assets/guide/diagram.jpg"')
  })

  it('rewrites parent-directory image refs that stay inside the content root', () => {
    const html = [
      '<picture>',
      '  <source srcset="../shared/hero.avif" type="image/avif">',
      '  <source srcset="../shared/hero.webp" type="image/webp">',
      '  <img src="../shared/hero.jpg" alt="Hero" width="64" height="32">',
      '</picture>',
    ].join('')

    const rewritten = rewriteContentAssetRefs(
      html,
      '/docs',
      makeAssetMap(['shared/hero.jpg']),
      'guide/intro',
    )

    expect(rewritten).toContain('srcset="/docs/assets/shared/hero.avif"')
    expect(rewritten).toContain('srcset="/docs/assets/shared/hero.webp"')
    expect(rewritten).toContain('src="/docs/assets/shared/hero.jpg"')
  })

  it('rewrites bare sibling asset filenames for the current route directory', () => {
    const html = [
      '<picture>',
      '  <source srcset="hero.avif" type="image/avif">',
      '  <source srcset="hero.webp 1x" type="image/webp">',
      '  <img src="hero.jpg" alt="Hero" width="40" height="20">',
      '</picture>',
    ].join('')

    const rewritten = rewriteContentAssetRefs(
      html,
      '/docs',
      makeAssetMap(['guide/hero.jpg']),
      'guide/intro',
    )

    expect(rewritten).toContain('srcset="/docs/assets/guide/hero.avif"')
    expect(rewritten).toContain('srcset="/docs/assets/guide/hero.webp 1x"')
    expect(rewritten).toContain('src="/docs/assets/guide/hero.jpg"')
  })

  it('normalizes backslash asset-map keys before rewriting HTML paths', () => {
    const assetMap: ContentAssetMap = {
      byPath: new Map([['guide\\hero.jpg', '/tmp/guide/hero.jpg']]),
      byBasename: new Map([['hero.jpg', ['guide\\hero.jpg']]]),
    }

    const rewritten = rewriteContentAssetRefs(
      '<img src="hero.jpg" alt="Hero">',
      '/docs',
      assetMap,
      'guide/intro',
    )

    expect(rewritten).toContain('src="/docs/assets/guide/hero.jpg"')
  })
})

describe('discoverBuiltAssets', () => {
  let outDir = ''

  afterEach(() => {
    if (outDir) {
      rmSync(outDir, { recursive: true, force: true })
      outDir = ''
    }
  })

  it('reads CSS and JS paths from single-quoted built HTML tags', () => {
    outDir = mkdtempSync(join(tmpdir(), 'ps-built-assets-'))
    writeFileSync(
      join(outDir, 'index.html'),
      [
        '<!doctype html>',
        '<html><head>',
        "  <link rel='stylesheet' href='/docs/assets/app.css'>",
        '</head><body>',
        "  <script type='module' src='/docs/assets/app.js'></script>",
        '</body></html>',
      ].join('\n'),
      'utf-8',
    )

    expect(discoverBuiltAssets(outDir, '/docs')).toEqual({
      cssPath: '/docs/assets/app.css',
      jsPath: '/docs/assets/app.js',
    })
  })

  it('preserves discovered asset paths when built HTML includes cache-busting query strings', () => {
    outDir = mkdtempSync(join(tmpdir(), 'ps-built-assets-'))
    writeFileSync(
      join(outDir, 'index.html'),
      [
        '<!doctype html>',
        '<html><head>',
        '  <link rel="stylesheet" href="/docs/assets/app.css?v=123">',
        '</head><body>',
        '  <script type="module" src="/docs/assets/app.js?hash=456"></script>',
        '</body></html>',
      ].join('\n'),
      'utf-8',
    )

    expect(discoverBuiltAssets(outDir, '/docs')).toEqual({
      cssPath: '/docs/assets/app.css?v=123',
      jsPath: '/docs/assets/app.js?hash=456',
    })
  })
})
