import { afterEach, describe, expect, it } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { hashAssets } from '../assets'

describe('hashAssets', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('preserves nested content asset paths when hashing and avoids basename collisions', () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-hash-assets-'))
    const contentDir = join(rootDir, 'content')
    const outDir = join(rootDir, 'dist')

    mkdirSync(join(contentDir, 'guide', 'alpha'), { recursive: true })
    mkdirSync(join(contentDir, 'guide', 'beta'), { recursive: true })
    mkdirSync(join(outDir, 'assets', 'guide', 'alpha'), { recursive: true })
    mkdirSync(join(outDir, 'assets', 'guide', 'beta'), { recursive: true })

    writeFileSync(join(contentDir, 'guide', 'alpha', 'diagram.svg'), '<svg>alpha</svg>', 'utf-8')
    writeFileSync(join(contentDir, 'guide', 'beta', 'diagram.svg'), '<svg>beta</svg>', 'utf-8')
    writeFileSync(
      join(outDir, 'assets', 'guide', 'alpha', 'diagram.svg'),
      '<svg>alpha</svg>',
      'utf-8',
    )
    writeFileSync(
      join(outDir, 'assets', 'guide', 'beta', 'diagram.svg'),
      '<svg>beta</svg>',
      'utf-8',
    )
    writeFileSync(
      join(outDir, 'index.html'),
      [
        '<!doctype html>',
        '<img src="/docs/assets/guide/alpha/diagram.svg" alt="alpha">',
        '<img src="/docs/assets/guide/beta/diagram.svg" alt="beta">',
      ].join('\n'),
      'utf-8',
    )

    hashAssets(outDir, contentDir)

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
    const alphaMatch = html.match(/\/docs\/assets\/(guide\/alpha\/diagram\.[a-f0-9]{8}\.svg)/)
    const betaMatch = html.match(/\/docs\/assets\/(guide\/beta\/diagram\.[a-f0-9]{8}\.svg)/)

    expect(alphaMatch).toBeTruthy()
    expect(betaMatch).toBeTruthy()
    expect(alphaMatch?.[1]).not.toBe(betaMatch?.[1])

    const alphaAsset = alphaMatch![1]
    const betaAsset = betaMatch![1]

    expect(existsSync(join(outDir, 'assets', alphaAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', betaAsset))).toBe(true)
    expect(existsSync(join(outDir, 'assets', 'guide', 'alpha', 'diagram.svg'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'guide', 'beta', 'diagram.svg'))).toBe(false)
    expect(existsSync(join(outDir, 'assets', 'diagram.svg'))).toBe(false)
    expect(readFileSync(join(outDir, 'assets', alphaAsset), 'utf-8')).toContain('alpha')
    expect(readFileSync(join(outDir, 'assets', betaAsset), 'utf-8')).toContain('beta')
  })
})
