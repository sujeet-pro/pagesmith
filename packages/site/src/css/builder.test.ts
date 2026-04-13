import { afterEach, describe, expect, it } from 'vite-plus/test'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildCss } from './builder.js'

describe('buildCss', () => {
  let tempDir = ''
  const fixturesRoot = join(process.cwd(), 'packages', 'site', 'src', 'css')

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
      tempDir = ''
    }
  })

  function tempFiles(): string[] {
    return readdirSync(tempDir).filter((file) => file.startsWith('.pagesmith-build-css-'))
  }

  it('bundles bare package imports and cleans the rewritten temp entry', () => {
    tempDir = mkdtempSync(join(fixturesRoot, '.builder-test-'))
    const entryPath = join(tempDir, 'theme.css')

    writeFileSync(
      entryPath,
      `@import "@pagesmith/site/css/code-inline";\n\n.demo { color: rebeccapurple; }\n`,
      'utf-8',
    )

    const css = buildCss(entryPath, { minify: false })

    expect(css).toContain('.prose code')
    expect(css).toContain('.demo')
    expect(tempFiles()).toEqual([])
  })

  it('includes the original entry path in build failures and still cleans temp files', () => {
    tempDir = mkdtempSync(join(fixturesRoot, '.builder-test-'))
    const entryPath = join(tempDir, 'broken.css')

    writeFileSync(
      entryPath,
      `@import "@pagesmith/site/css/code-inline";\n@import "./missing.css";\n`,
      'utf-8',
    )

    expect(() => buildCss(entryPath, { minify: false })).toThrow(
      `CSS build failed for ${entryPath}`,
    )
    expect(tempFiles()).toEqual([])
  })
})
