import type { MarkdownConfig } from '@pagesmith/core/markdown'
import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { basename, dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

type FooterLink = {
  label: string
  path: string
}

export type DocsUserConfig = {
  name?: string
  title?: string
  description?: string
  origin?: string
  language?: string
  contentDir?: string
  outDir?: string
  publicDir?: string
  /** Base path for deployment under a subdirectory (e.g. '/docs'). Overridden by BASE_URL env var. */
  basePath?: string
  /** Override the header logo link destination (defaults to basePath). */
  homeLink?: string
  footerLinks?: FooterLink[]
  sidebar?: {
    /** Enable collapsible sidebar section groups (default: false) */
    collapsible?: boolean
  }
  search?: {
    enabled?: boolean
    /** Show images in search results (default: false) */
    showImages?: boolean
    /** Show sub-results/sections within pages (default: true) */
    showSubResults?: boolean
    /** Extra CLI flags passed to the pagefind binary */
    pagefindFlags?: string[]
  }
  theme?: {
    lightColor?: string
    darkColor?: string
    layouts?: Record<string, string>
  }
  analytics?: {
    googleAnalytics?: string
  }
  /** Path to favicon file relative to project root. Defaults to 'public/favicon.svg'. Set to false to disable. */
  favicon?: string | false
  markdown?: MarkdownConfig
  home?: {
    configFile?: string
  }
  /** Optional multi-package navigation labels. Maps section slug to display label. */
  packages?: Record<string, { label: string }>
}

export type ResolvedDocsConfig = {
  rootDir: string
  contentDir: string
  outDir: string
  publicDir: string
  basePath: string
  homeLink?: string
  name: string
  title: string
  description: string
  origin: string
  language: string
  footerLinks: FooterLink[]
  sidebar: {
    collapsible: boolean
  }
  search: {
    enabled: boolean
    showImages: boolean
    showSubResults: boolean
    pagefindFlags: string[]
  }
  theme?: {
    lightColor?: string
    darkColor?: string
    layouts?: Record<string, string>
  }
  analytics?: {
    googleAnalytics?: string
  }
  /** Resolved absolute path to favicon file, or false if disabled. */
  favicon: string | false
  markdown?: MarkdownConfig
  homeConfigFile?: string
  packages?: Record<string, { label: string }>
}

export type DocsBuildOptions = {
  configPath?: string
  /** Override output directory from CLI (takes precedence over config). */
  outDir?: string
  /** Override base path from CLI (takes precedence over config and BASE_URL env). */
  basePath?: string
}

export type DocsDevOptions = DocsBuildOptions & {
  port?: number
  open?: boolean
}

export function defineDocsConfig(config: DocsUserConfig): DocsUserConfig {
  return config
}

export function loadDocsConfig(configPath?: string): DocsUserConfig {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  if (!existsSync(resolvedConfigPath)) {
    return {}
  }

  return JSON5.parse(readFileSync(resolvedConfigPath, 'utf-8')) as DocsUserConfig
}

export function resolveDocsConfig(
  configPath?: string,
  overrides?: { outDir?: string; basePath?: string },
): ResolvedDocsConfig {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const rootDir = dirname(resolvedConfigPath)
  const userConfig = loadDocsConfig(resolvedConfigPath)
  const packageName = basename(rootDir)

  // CLI flag > BASE_URL env > config basePath > default '/'
  const rawBase = overrides?.basePath ?? process.env.BASE_URL ?? userConfig.basePath ?? '/'
  const basePath = rawBase.replace(/\/+$/, '') // strip trailing slash, '/' becomes ''

  // Resolve favicon path
  let resolvedFavicon: string | false
  if (userConfig.favicon === false) {
    resolvedFavicon = false
  } else if (typeof userConfig.favicon === 'string') {
    resolvedFavicon = resolve(rootDir, userConfig.favicon)
  } else {
    // Default: check public/favicon.svg, then public/favicon.ico, then bundled default
    const publicDir = resolve(rootDir, userConfig.publicDir ?? 'public')
    const svgPath = join(publicDir, 'favicon.svg')
    const icoPath = join(publicDir, 'favicon.ico')
    if (existsSync(svgPath)) {
      resolvedFavicon = svgPath
    } else if (existsSync(icoPath)) {
      resolvedFavicon = icoPath
    } else {
      const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
      resolvedFavicon = join(corePkgDir, 'assets', 'favicon.svg')
    }
  }

  return {
    rootDir,
    contentDir: resolve(rootDir, userConfig.contentDir ?? 'content'),
    outDir: overrides?.outDir ?? resolve(rootDir, userConfig.outDir ?? 'dist'),
    publicDir: resolve(rootDir, userConfig.publicDir ?? 'public'),
    basePath,
    homeLink: userConfig.homeLink,
    name: userConfig.name ?? userConfig.title ?? packageName,
    title: userConfig.title ?? userConfig.name ?? packageName,
    description: userConfig.description ?? 'Documentation site powered by @pagesmith/docs',
    origin: userConfig.origin ?? 'https://example.com',
    language: userConfig.language ?? 'en',
    footerLinks: userConfig.footerLinks ?? [],
    search: {
      enabled: userConfig.search?.enabled ?? true,
      showImages: userConfig.search?.showImages ?? false,
      showSubResults: userConfig.search?.showSubResults ?? true,
      pagefindFlags: userConfig.search?.pagefindFlags ?? [],
    },
    sidebar: {
      collapsible: userConfig.sidebar?.collapsible ?? false,
    },
    favicon: resolvedFavicon,
    theme: userConfig.theme,
    analytics: userConfig.analytics,
    markdown: userConfig.markdown,
    homeConfigFile: userConfig.home?.configFile
      ? resolve(rootDir, userConfig.home.configFile)
      : resolve(rootDir, 'content/home.json5'),
    packages: userConfig.packages,
  }
}

export function readJson5File<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON5.parse(readFileSync(filePath, 'utf-8')) as T
}

export function toTitleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getPackageDir(): string {
  return resolve(import.meta.dirname, '..')
}

export function getThemeRoot(): string {
  return resolve(getPackageDir(), 'theme')
}

export function getThemeStylesEntry(): string {
  return resolve(getThemeRoot(), 'styles/main.css')
}

export function getThemeRuntimeEntry(): string {
  return resolve(getThemeRoot(), 'runtime/main.ts')
}
