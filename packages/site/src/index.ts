export {
  defineSiteConfig,
  loadSiteConfig,
  normalizePresetSpecifier,
  resolveSitePresetSpecifier,
} from './config.js'
export type { SiteUserConfig } from './config.js'
export type { SiteBuildOptions, SiteDevOptions, SiteLogLevel, SitePreset } from './preset.js'

export const SITE_PACKAGE_NAME = '@pagesmith/site'
