import type { Heading } from '../schemas/index.js'

export type { Heading }

export type SiteNavItem = {
  label: string
  path: string
}

export type SiteSidebarItem = {
  title: string
  path: string
  children?: SiteSidebarItem[]
}

export type SiteSidebarSection = {
  title: string
  slug?: string
  collapsed?: boolean
  items: SiteSidebarItem[]
}

export type SitePageLink = {
  title: string
  path: string
}

export type SiteBreadcrumb = {
  label: string
  path?: string
}

export type SiteFooterLink = {
  label: string
  path: string
}

export type SiteFooterLinkGroup = {
  header?: string
  links: SiteFooterLink[]
}

export type SiteFooterLinks = SiteFooterLink[] | SiteFooterLinkGroup[]

export type SiteMaintainer = {
  name: string
  link?: string
}

export type SiteCopyright = {
  projectName: string
  startYear: number
  endYear?: number | null
}

export type SiteThemeOption = {
  value: string
  label: string
}

export type SiteThemeControls = {
  appearanceLabel?: string
  themeLabel?: string
  textSizeLabel?: string
  dropdownButtonLabel?: string
  colorSchemeOptions?: SiteThemeOption[]
  themeOptions?: SiteThemeOption[]
  textSizeOptions?: SiteThemeOption[]
}

export type SiteListingCardMeta = {
  label?: string
  value: string
  datetime?: string
}

export type SiteListingCard = {
  title: string
  path: string
  description?: string
  eyebrow?: string
  meta?: SiteListingCardMeta[]
  content?: unknown
}

export type SiteListingGroup = {
  slug?: string
  title: string
  description?: string
  cards: SiteListingCard[]
}

export type SiteDocumentSeo = {
  locale?: string
  twitterHandle?: string
  defaultOgType?: string
}

export type SiteDocumentTheme = {
  lightColor?: string
  darkColor?: string
  defaultColorScheme?: string
  defaultTheme?: string
  defaultTextSize?: string
}

export type SiteDocumentSearch = {
  enabled?: boolean
  showImages?: boolean
  showSubResults?: boolean
}

export type SiteDocumentAnalytics = {
  googleAnalytics?: string
}

export type SiteDocumentScript = {
  src: string
  type?: 'module' | 'text/javascript'
  defer?: boolean
  async?: boolean
}

export type SiteDocumentData = {
  origin: string
  basePath?: string
  name: string
  title?: string
  description?: string
  language?: string
  homeLink?: string
  trailingSlash?: boolean
  icon?: string | false
  navItems?: SiteNavItem[]
  footerLinks?: SiteFooterLinks
  footerText?: string
  maintainer?: SiteMaintainer
  copyright?: SiteCopyright
  sidebar?: {
    collapsible?: boolean
  }
  search?: SiteDocumentSearch
  seo?: SiteDocumentSeo
  theme?: SiteDocumentTheme
  analytics?: SiteDocumentAnalytics
  socialImage?: string
  favicon?: string | false
  faviconFallback?: string | false
  appleTouchIcon?: string | false
  cssPath?: string
  jsPath?: string
  stylesheets?: string[]
  scripts?: SiteDocumentScript[]
}
