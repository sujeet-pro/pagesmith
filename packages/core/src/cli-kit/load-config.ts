/**
 * Unified Pagesmith config loader.
 *
 * Resolves and reads `pagesmith.config.{ts,mts,js,mjs,json5,json}` (in that
 * order of preference). Each Pagesmith CLI uses this to:
 *   - Locate a config without forcing the user to pass `--config`.
 *   - Seed prompt defaults during interactive flows.
 *   - Pass a normalized config path/object to the underlying preset/resolver.
 *
 * The loader returns a loose `Record<string, unknown>` so the calling package
 * can narrow with its own zod schema (`DocsConfigSchema`, `SiteUserConfigSchema`,
 * etc.) — keeping cli-kit free of package-specific shapes.
 */

import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { isAbsolute, resolve } from 'path'
import { pathToFileURL } from 'url'
import { CliError } from './errors.js'

export type PagesmithConfigFormat = 'ts' | 'mts' | 'js' | 'mjs' | 'json5' | 'json'

export const PAGESMITH_CONFIG_BASENAMES = [
  'pagesmith.config.ts',
  'pagesmith.config.mts',
  'pagesmith.config.mjs',
  'pagesmith.config.js',
  'pagesmith.config.json5',
  'pagesmith.config.json',
] as const

export type PagesmithConfigFile = {
  /** Absolute path to the resolved config file, or `undefined` if none was found. */
  configPath?: string
  /** File extension without the leading dot. */
  format?: PagesmithConfigFormat
  /** Raw config object, or `undefined` if no config file was found. */
  config?: Record<string, unknown>
}

function detectFormat(file: string): PagesmithConfigFormat | undefined {
  if (file.endsWith('.ts')) return 'ts'
  if (file.endsWith('.mts')) return 'mts'
  if (file.endsWith('.mjs')) return 'mjs'
  if (file.endsWith('.js')) return 'js'
  if (file.endsWith('.json5')) return 'json5'
  if (file.endsWith('.json')) return 'json'
  return undefined
}

export type FindConfigOptions = {
  /** Base directory used to resolve relative paths. Defaults to `process.cwd()`. */
  cwd?: string
  /**
   * Explicit user-supplied path (e.g. `--config ./my.config.ts`). When set,
   * this is the only candidate considered.
   */
  explicitPath?: string
}

export function findPagesmithConfig(options: FindConfigOptions = {}): {
  configPath?: string
  format?: PagesmithConfigFormat
} {
  const cwd = options.cwd ?? process.cwd()
  if (options.explicitPath) {
    const resolved = isAbsolute(options.explicitPath)
      ? options.explicitPath
      : resolve(cwd, options.explicitPath)
    if (!existsSync(resolved)) {
      throw new CliError(`Config file not found: ${resolved}`, {
        hint:
          'Pass an existing path to --config, or omit the flag to auto-discover ' +
          'pagesmith.config.{ts,mts,js,mjs,json5,json}.',
      })
    }
    const format = detectFormat(resolved)
    if (!format) {
      throw new CliError(`Unsupported config file extension: ${resolved}`, {
        hint: 'Supported: .ts, .mts, .js, .mjs, .json5, .json',
      })
    }
    return { configPath: resolved, format }
  }

  for (const basename of PAGESMITH_CONFIG_BASENAMES) {
    const candidate = resolve(cwd, basename)
    if (existsSync(candidate)) {
      const format = detectFormat(candidate)
      if (!format) continue
      return { configPath: candidate, format }
    }
  }
  return {}
}

function parseJsonLike(filePath: string): Record<string, unknown> {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const parsed = JSON5.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    throw new Error('expected an object')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new CliError(`Failed to parse config file: ${filePath}`, {
      cause: err,
      hint: `Check that the file contains a valid JSON5 object. (${message})`,
    })
  }
}

async function loadEsmModule(filePath: string): Promise<Record<string, unknown>> {
  try {
    const url = pathToFileURL(filePath).href
    const mod = (await import(url)) as { default?: unknown } & Record<string, unknown>
    const value = mod.default ?? mod
    if (value && typeof value === 'object') return value as Record<string, unknown>
    throw new Error('expected the default export to be an object')
  } catch (err) {
    throw new CliError(`Failed to load config module: ${filePath}`, {
      cause: err,
      hint: 'Ensure the file exports a default object via `export default { ... }` or `defineConfig({ ... })`.',
    })
  }
}

async function loadTsModule(filePath: string): Promise<Record<string, unknown>> {
  try {
    const { createJiti } = await import('jiti')
    const jiti = createJiti(import.meta.url, { interopDefault: true, fsCache: false })
    const mod = (await jiti.import(filePath)) as unknown
    const value =
      mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)
        ? (mod as { default: unknown }).default
        : mod
    if (value && typeof value === 'object') return value as Record<string, unknown>
    throw new Error('expected the default export to be an object')
  } catch (err) {
    throw new CliError(`Failed to load TypeScript config: ${filePath}`, {
      cause: err,
      hint: 'Ensure the file exports a default object via `export default { ... }` or `defineConfig({ ... })`.',
    })
  }
}

export async function readPagesmithConfig(
  configPath: string,
  format?: PagesmithConfigFormat,
): Promise<Record<string, unknown>> {
  const fmt = format ?? detectFormat(configPath)
  if (!fmt) {
    throw new CliError(`Unsupported config file extension: ${configPath}`, {
      hint: 'Supported: .ts, .mts, .js, .mjs, .json5, .json',
    })
  }
  switch (fmt) {
    case 'json':
    case 'json5':
      return parseJsonLike(configPath)
    case 'js':
    case 'mjs':
      return loadEsmModule(configPath)
    case 'ts':
    case 'mts':
      return loadTsModule(configPath)
  }
}

/**
 * Find and load the closest Pagesmith config. Returns an empty object when no
 * config is found so callers can treat the result as "use defaults". When the
 * config file exists but cannot be parsed/imported, throws a `CliError` with a
 * helpful hint.
 */
export async function loadPagesmithConfig(
  options: FindConfigOptions = {},
): Promise<PagesmithConfigFile> {
  const found = findPagesmithConfig(options)
  if (!found.configPath || !found.format) return {}
  const config = await readPagesmithConfig(found.configPath, found.format)
  return { configPath: found.configPath, format: found.format, config }
}
