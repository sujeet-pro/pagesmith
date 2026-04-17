import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  CliError,
  findPagesmithConfig,
  loadPagesmithConfig,
  PAGESMITH_CONFIG_BASENAMES,
} from '../cli-kit/index.js'

describe('findPagesmithConfig + loadPagesmithConfig', () => {
  let tmpDir = ''

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ps-cli-kit-load-'))
  })

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { recursive: true, force: true })
      tmpDir = ''
    }
  })

  it('returns nothing when no config exists', () => {
    expect(findPagesmithConfig({ cwd: tmpDir })).toEqual({})
  })

  it('lists every supported basename in preferred order', () => {
    expect(PAGESMITH_CONFIG_BASENAMES).toEqual([
      'pagesmith.config.ts',
      'pagesmith.config.mts',
      'pagesmith.config.mjs',
      'pagesmith.config.js',
      'pagesmith.config.json5',
      'pagesmith.config.json',
    ])
  })

  it('prefers .ts over .json5 when both exist', () => {
    writeFileSync(
      join(tmpDir, 'pagesmith.config.ts'),
      `export default { name: 'from-ts' }\n`,
      'utf-8',
    )
    writeFileSync(join(tmpDir, 'pagesmith.config.json5'), `{ name: 'from-json5' }\n`, 'utf-8')

    const found = findPagesmithConfig({ cwd: tmpDir })
    expect(found.format).toBe('ts')
    expect(found.configPath?.endsWith('pagesmith.config.ts')).toBe(true)
  })

  it('loads JSON5 configs', async () => {
    writeFileSync(
      join(tmpDir, 'pagesmith.config.json5'),
      `{ name: 'json5-app', basePath: '/app' }\n`,
      'utf-8',
    )

    const result = await loadPagesmithConfig({ cwd: tmpDir })
    expect(result.format).toBe('json5')
    expect(result.config?.name).toBe('json5-app')
    expect(result.config?.basePath).toBe('/app')
  })

  it('loads .mjs configs via dynamic import', async () => {
    writeFileSync(
      join(tmpDir, 'pagesmith.config.mjs'),
      `export default { name: 'mjs-app', basePath: '/mjs' }\n`,
      'utf-8',
    )

    const result = await loadPagesmithConfig({ cwd: tmpDir })
    expect(result.format).toBe('mjs')
    expect(result.config?.name).toBe('mjs-app')
  })

  it('loads .ts configs via jiti', async () => {
    writeFileSync(
      join(tmpDir, 'pagesmith.config.ts'),
      `export default { name: 'ts-app', basePath: '/ts' }\n`,
      'utf-8',
    )

    const result = await loadPagesmithConfig({ cwd: tmpDir })
    expect(result.format).toBe('ts')
    expect(result.config?.name).toBe('ts-app')
  })

  it('throws CliError for explicit paths that do not exist', () => {
    expect(() =>
      findPagesmithConfig({ cwd: tmpDir, explicitPath: 'missing.config.json5' }),
    ).toThrow(CliError)
  })

  it('throws CliError for unsupported extensions', () => {
    const yamlPath = join(tmpDir, 'pagesmith.config.yaml')
    writeFileSync(yamlPath, 'name: yaml-app\n', 'utf-8')
    expect(() => findPagesmithConfig({ cwd: tmpDir, explicitPath: yamlPath })).toThrow(
      /Unsupported config file extension/,
    )
  })

  it('throws CliError when JSON5 parsing fails', async () => {
    writeFileSync(join(tmpDir, 'pagesmith.config.json5'), 'not-valid:', 'utf-8')
    await expect(loadPagesmithConfig({ cwd: tmpDir })).rejects.toThrow(
      /Failed to parse config file/,
    )
  })
})
