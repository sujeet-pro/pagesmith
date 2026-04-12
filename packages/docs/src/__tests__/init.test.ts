import { afterEach, describe, expect, it } from 'vite-plus/test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import JSON5 from 'json5'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  applyExistingConfigDefaults,
  getDocsConfigSchemaRef,
  type InitAnswers,
  updateInitConfigFile,
} from '../cli/init.js'

function makeAnswers(overrides: Partial<InitAnswers> = {}): InitAnswers {
  return {
    name: 'repo-name',
    title: 'Repo Docs',
    origin: 'https://owner.github.io',
    basePath: '/repo-name',
    contentDir: 'docs',
    copyrightStartYear: 2024,
    search: true,
    ai: false,
    starterContent: true,
    ...overrides,
  }
}

describe('init config helpers', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  function setupTmpDir(): string {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-init-'))
    return tmpDir
  }

  it('computes the schema ref relative to the config file', () => {
    const projectDir = setupTmpDir()

    expect(getDocsConfigSchemaRef(projectDir, join(projectDir, 'pagesmith.config.json5'))).toBe(
      './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
    )
    expect(
      getDocsConfigSchemaRef(projectDir, join(projectDir, 'config', 'pagesmith.config.json5')),
    ).toBe('../node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json')
  })

  it('uses the existing config as the default source for reruns', () => {
    const defaults = makeAnswers()
    const merged = applyExistingConfigDefaults(defaults, {
      name: 'existing-name',
      title: 'Existing Docs',
      origin: 'https://docs.example.com',
      basePath: '/existing',
      contentDir: './content',
      search: { enabled: false },
      copyright: { startYear: 2020 },
    })

    expect(merged.name).toBe('existing-name')
    expect(merged.title).toBe('Existing Docs')
    expect(merged.origin).toBe('https://docs.example.com')
    expect(merged.basePath).toBe('/existing')
    expect(merged.contentDir).toBe('./content')
    expect(merged.search).toBe(false)
    expect(merged.copyrightStartYear).toBe(2020)
  })

  it('updates existing configs by filling missing scaffold fields and preserving custom ones', () => {
    const projectDir = setupTmpDir()
    const configPath = join(projectDir, 'pagesmith.config.json5')

    writeFileSync(
      configPath,
      [
        '{',
        "  title: 'Existing Docs',",
        "  contentDir: './docs',",
        "  theme: { defaultTheme: 'paper' },",
        '  search: { showImages: true },',
        '  copyright: { startYear: 2020 },',
        '}',
        '',
      ].join('\n'),
      'utf-8',
    )

    const result = updateInitConfigFile({
      projectDir,
      configPath,
      answers: makeAnswers({
        title: 'Existing Docs',
        contentDir: './docs',
      }),
    })

    expect(result.changed).toBe(true)
    expect(result.created).toBe(false)
    expect(result.updated).toBe(true)

    const nextConfig = JSON5.parse(readFileSync(configPath, 'utf-8')) as {
      $schema?: string
      name?: string
      title?: string
      contentDir?: string
      outDir?: string
      theme?: { defaultTheme?: string }
      search?: { enabled?: boolean; showImages?: boolean }
      copyright?: { projectName?: string; startYear?: number; endYear?: number | null }
    }

    expect(nextConfig.$schema).toBe(
      './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
    )
    expect(nextConfig.name).toBe('repo-name')
    expect(nextConfig.title).toBe('Existing Docs')
    expect(nextConfig.contentDir).toBe('./docs')
    expect(nextConfig.outDir).toBe('gh-pages')
    expect(nextConfig.theme).toEqual({ defaultTheme: 'paper' })
    expect(nextConfig.search).toEqual({
      enabled: true,
      showImages: true,
    })
    expect(nextConfig.copyright).toEqual({
      projectName: 'Existing Docs',
      startYear: 2020,
      endYear: null,
    })
  })

  it('does not rewrite configs that already match the scaffolded state', () => {
    const projectDir = setupTmpDir()
    const configPath = join(projectDir, 'pagesmith.config.json5')

    writeFileSync(
      configPath,
      [
        '{',
        "  $schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',",
        "  name: 'repo-name',",
        "  title: 'Repo Docs',",
        "  origin: 'https://owner.github.io',",
        "  basePath: '/repo-name',",
        "  contentDir: 'docs',",
        "  outDir: 'gh-pages',",
        '  copyright: {',
        "    projectName: 'Repo Docs',",
        '    startYear: 2024,',
        '    endYear: null,',
        '  },',
        '  search: { enabled: true },',
        '}',
        '',
      ].join('\n'),
      'utf-8',
    )

    const before = readFileSync(configPath, 'utf-8')
    const result = updateInitConfigFile({
      projectDir,
      configPath,
      answers: makeAnswers(),
    })
    const after = readFileSync(configPath, 'utf-8')

    expect(result.changed).toBe(false)
    expect(result.created).toBe(false)
    expect(result.updated).toBe(false)
    expect(after).toBe(before)
  })
})
