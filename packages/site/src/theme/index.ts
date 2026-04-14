import type { SiteThemeControls, SiteThemeOption } from '../components/types.js'

export type ResolvedSiteThemeControls = {
  appearanceLabel: string
  themeLabel: string
  textSizeLabel: string
  dropdownButtonLabel: string
  colorSchemeOptions: SiteThemeOption[]
  themeOptions: SiteThemeOption[]
  textSizeOptions: SiteThemeOption[]
}

export const DEFAULT_COLOR_SCHEME_OPTIONS: SiteThemeOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export const DEFAULT_THEME_OPTIONS: SiteThemeOption[] = [
  { value: 'paper', label: 'Paper' },
  { value: 'high-contrast', label: 'High Contrast' },
]

export const DEFAULT_TEXT_SIZE_OPTIONS: SiteThemeOption[] = [
  { value: 'small', label: 'Small' },
  { value: 'base', label: 'Default' },
  { value: 'large', label: 'Large' },
]

export function resolveThemeControls(controls?: SiteThemeControls): ResolvedSiteThemeControls {
  return {
    appearanceLabel: controls?.appearanceLabel ?? 'Appearance',
    themeLabel: controls?.themeLabel ?? 'Theme',
    textSizeLabel: controls?.textSizeLabel ?? 'Text Size',
    dropdownButtonLabel: controls?.dropdownButtonLabel ?? 'Change theme',
    colorSchemeOptions: controls?.colorSchemeOptions ?? DEFAULT_COLOR_SCHEME_OPTIONS,
    themeOptions: controls?.themeOptions ?? DEFAULT_THEME_OPTIONS,
    textSizeOptions: controls?.textSizeOptions ?? DEFAULT_TEXT_SIZE_OPTIONS,
  }
}
