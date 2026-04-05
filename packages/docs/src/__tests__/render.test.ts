import { afterEach, describe, expect, it } from 'vite-plus/test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { resolveDocsConfig } from '../config.js'
import { renderDocs } from '../render.js'

describe('renderDocs', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('renders a minimal docs site', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-render-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Render Test", origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nWelcome!', 'utf-8')
    writeFileSync(join(rootDir, 'content', 'guide', 'intro.md'), '# Intro\n\nGuide page.', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    mkdirSync(config.outDir, { recursive: true })

    const { pages, model } = await renderDocs(config)

    expect(pages.length).toBe(2)
    expect(model.pageByPath.has('/')).toBe(true)
    expect(model.pageByPath.has('/guide/intro')).toBe(true)
    expect(existsSync(join(config.outDir, 'index.html'))).toBe(true)
    expect(existsSync(join(config.outDir, 'guide', 'intro', 'index.html'))).toBe(true)
    expect(existsSync(join(config.outDir, '404.html'))).toBe(true)
  })
})
