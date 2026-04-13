import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { resolve } from 'path'

export type SiteUserConfig = {
  preset?: string
  presets?: string[]
  [key: string]: unknown
}

export function defineSiteConfig<T extends SiteUserConfig>(config: T): T {
  return config
}

export function normalizePresetSpecifier(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.endsWith('/preset')) return value
  if (value.startsWith('@pagesmith/')) return `${value}/preset`
  return value
}

export function loadSiteConfig(configPath = 'pagesmith.config.json5'): SiteUserConfig | undefined {
  const resolved = resolve(configPath)
  if (!existsSync(resolved)) return undefined
  return JSON5.parse(readFileSync(resolved, 'utf-8')) as SiteUserConfig
}

export function resolveSitePresetSpecifier(
  configPath = 'pagesmith.config.json5',
  fallback = process.env.PAGESMITH_PRESET ?? '@pagesmith/site/preset',
): string {
  const config = loadSiteConfig(configPath)
  const direct = normalizePresetSpecifier(config?.preset)
  if (direct) return direct

  const firstPreset = Array.isArray(config?.presets) ? config.presets[0] : undefined
  return normalizePresetSpecifier(firstPreset) ?? fallback
}
