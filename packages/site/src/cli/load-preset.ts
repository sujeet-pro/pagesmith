/**
 * Loads a site preset module (ESM dynamic import).
 *
 * Convention: the module exports a factory function as `default`, `docsPreset`,
 * `sitePreset`, or `preset`. The factory returns an object that may implement
 * `build`, `dev`, and `preview` (all optional; the CLI validates per command).
 */
import { normalizePresetSpecifier, resolveSitePresetSpecifier } from '../config.js'
import type { SitePreset } from '../preset.js'

export type SitePresetHandle = {
  build?(options?: Record<string, unknown>): Promise<void>
  dev?(options?: Record<string, unknown>): Promise<void>
  preview?(options?: Record<string, unknown>): Promise<void>
  init?(argv: string[]): Promise<void>
  mcp?(argv: string[]): Promise<void>
}

const FACTORY_KEYS = ['default', 'docsPreset', 'sitePreset', 'preset'] as const

export async function loadSitePreset(specifier: string): Promise<SitePreset> {
  const mod = await import(specifier)
  let factory: unknown
  for (const key of FACTORY_KEYS) {
    if (typeof mod[key] === 'function') {
      factory = mod[key]
      break
    }
  }
  if (typeof factory !== 'function') {
    throw new Error(
      `Preset "${specifier}" must export default, docsPreset, sitePreset, or preset as a function.`,
    )
  }
  const instance = (factory as () => unknown)()
  if (!instance || typeof instance !== 'object') {
    throw new Error(`Preset factory from "${specifier}" must return an object.`)
  }
  return instance as SitePreset
}

export function defaultPresetSpecifier(configPath?: string): string {
  return resolveSitePresetSpecifier(
    configPath,
    process.env.PAGESMITH_PRESET ?? '@pagesmith/site/preset',
  )
}

export function extractPresetArgv(argv: string[]): { specifier?: string; rest: string[] } {
  const rest = [...argv]
  let specifier: string | undefined

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]!
    if (arg === '--preset') {
      const value = rest[i + 1]
      if (!value)
        throw new Error('--preset requires a module specifier (e.g. @pagesmith/docs/preset)')
      specifier = value
      rest.splice(i, 2)
      i -= 1
      continue
    }
    if (arg.startsWith('--preset=')) {
      const value = arg.slice('--preset='.length)
      if (!value) throw new Error('--preset= requires a non-empty module specifier')
      specifier = value
      rest.splice(i, 1)
      i -= 1
    }
  }

  return { specifier, rest }
}

export function resolvePresetSpecifier(
  explicitSpecifier: string | undefined,
  configPath?: string,
): string {
  return normalizePresetSpecifier(explicitSpecifier) ?? defaultPresetSpecifier(configPath)
}
