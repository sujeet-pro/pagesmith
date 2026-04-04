import type { MarkdownConfig } from '@pagesmith/core/markdown'
import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
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
    /** Path to default social sharing image, relative to publicDir or an absolute URL */
    socialImage?: string
  }
  analytics?: {
    googleAnalytics?: string
  }
  /** Path to favicon file relative to project root. Defaults to 'public/favicon.svg'. Set to false to disable. */
  favicon?: string | false
  /** Show "Edit this page" link on each page. */
  editLink?: {
    /** GitHub/GitLab repo URL (e.g. 'https://github.com/user/repo') */
    repo: string
    /** Branch name (default: 'main') */
    branch?: string
    /** Label for the link (default: 'Edit this page') */
    label?: string
  }
  /** Show git-based "last updated" timestamp on pages (default: false) */
  lastUpdated?: boolean
  /** Generate sitemap.xml during build (default: true when origin is set). Set false to disable. */
  sitemap?: boolean
  markdown?: MarkdownConfig
  home?: {
    configFile?: string
  }
  /** Optional multi-package navigation labels. Maps section slug to display label. */
  packages?: Record<string, { label: string }>
  /**
   * Map output paths to source files/folders that should be copied to the build output.
   * Keys are output directory paths (e.g. "/" for root, "/api" for api/).
   * Values are arrays of file or folder names resolved relative to the project root.
   * Folders are copied recursively.
   *
   * @example
   * ```json5
   * { assets: { "/": ["llms.txt", "robots.txt"], "/api": ["openapi.json"] } }
   * ```
   */
  assets?: Record<string, string[]>
  /** Server port and behavior settings for dev and preview commands. */
  server?: {
    /** Default port for the dev server (default: 3000). */
    devPort?: number
    /** Default port for the preview server (default: 4000). */
    previewPort?: number
    /** When true, fail if the configured port is in use instead of finding the next available port (default: false). */
    strictPort?: boolean
  }
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
  /** Resolved path to default social sharing image, or undefined if not set. */
  socialImage?: string
  /** Resolved absolute path to favicon file, or false if disabled. */
  favicon: string | false
  /** Resolved absolute path to apple-touch-icon, or false if not found. */
  appleTouchIcon: string | false
  /** Resolved absolute path to ICO fallback (when primary favicon is SVG), or false. */
  faviconFallback: string | false
  editLink?: {
    repo: string
    branch: string
    label: string
    /** Pre-computed edit URL pattern (includes host-specific path structure). */
    editPattern: string
  }
  lastUpdated: boolean
  sitemap: boolean
  markdown?: MarkdownConfig
  homeConfigFile?: string
  packages?: Record<string, { label: string }>
  /** Resolved asset mappings: output path → array of resolved absolute source paths. */
  assets: Map<string, string[]>
  /** Resolved server settings. */
  server: {
    devPort: number
    previewPort: number
    strictPort: boolean
  }
  /** @internal Raw user config — used by validateConfig to distinguish explicit values from fallbacks. */
  _userConfig?: DocsUserConfig
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

/** Prefix a path with a base path, avoiding double slashes. */
export function withBase(basePath: string, path: string): string {
  const base = basePath.replace(/\/+$/, '')
  if (!base) return path
  if (path.startsWith(base)) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

type GitOriginInfo = {
  basePath?: string
  origin?: string
  repoName?: string
  editLinkHost?: 'github' | 'gitlab' | 'bitbucket'
}

/** Detect basePath and origin from git remote URL. */
export function detectGitOrigin(rootDir: string): GitOriginInfo | undefined {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    }).trim()

    // GitHub HTTPS: https://github.com/owner/repo.git
    // GitHub SSH: git@github.com:owner/repo.git
    let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/)
    if (match) {
      const [, owner, repo] = match
      return {
        basePath: `/${repo}`,
        origin: `https://${owner}.github.io`,
        repoName: repo,
        editLinkHost: 'github',
      }
    }

    // GitLab HTTPS/SSH
    match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/)
    if (match) {
      const [, owner, repo] = match
      return {
        basePath: `/${repo}`,
        origin: `https://${owner}.gitlab.io`,
        repoName: repo,
        editLinkHost: 'gitlab',
      }
    }

    // Bitbucket HTTPS/SSH
    match = remoteUrl.match(/bitbucket\.org[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/)
    if (match) {
      const [, , repo] = match
      return {
        basePath: `/${repo}`,
        repoName: repo,
        editLinkHost: 'bitbucket',
      }
    }
  } catch {
    // Not a git repo or git not installed — skip silently
  }
  return undefined
}

function readPackageJson(
  rootDir: string,
): { name?: string; description?: string; homepage?: string } | undefined {
  const pkgPath = join(rootDir, 'package.json')
  if (!existsSync(pkgPath)) return undefined
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8'))
  } catch {
    return undefined
  }
}

function resolveContentDir(rootDir: string, explicit?: string): string {
  if (explicit) return resolve(rootDir, explicit)
  const docsDir = resolve(rootDir, 'docs')
  if (existsSync(docsDir)) return docsDir
  return resolve(rootDir, 'content')
}

export function resolveDocsConfig(
  configPath?: string,
  overrides?: { outDir?: string; basePath?: string },
): ResolvedDocsConfig {
  const resolvedConfigPath = resolve(configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const rootDir = dirname(resolvedConfigPath)
  const userConfig = loadDocsConfig(resolvedConfigPath)
  const packageName = basename(rootDir)
  const pkg = readPackageJson(rootDir)
  const pkgDisplayName = pkg?.name?.replace(/^@[^/]+\//, '')

  // Detect git origin for smart defaults
  const gitInfo = detectGitOrigin(rootDir)

  // CLI flag > BASE_URL env > config basePath > git-detected > default '/'
  const rawBase =
    overrides?.basePath ?? process.env.BASE_URL ?? userConfig.basePath ?? gitInfo?.basePath ?? '/'
  const basePath = rawBase.replace(/\/+$/, '') // strip trailing slash, '/' becomes ''

  const contentDir = resolveContentDir(rootDir, userConfig.contentDir)
  const publicDir = resolve(rootDir, userConfig.publicDir ?? 'public')

  // Resolve favicon path
  let resolvedFavicon: string | false
  let resolvedFaviconFallback: string | false = false
  if (userConfig.favicon === false) {
    resolvedFavicon = false
  } else if (typeof userConfig.favicon === 'string') {
    resolvedFavicon = resolve(rootDir, userConfig.favicon)
  } else {
    // Default: check public/favicon.svg, then public/favicon.ico, then bundled default
    const svgPath = join(publicDir, 'favicon.svg')
    const icoPath = join(publicDir, 'favicon.ico')
    if (existsSync(svgPath)) {
      resolvedFavicon = svgPath
      // When SVG is primary, offer ICO as fallback for older browsers
      if (existsSync(icoPath)) {
        resolvedFaviconFallback = icoPath
      }
    } else if (existsSync(icoPath)) {
      resolvedFavicon = icoPath
    } else {
      const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
      resolvedFavicon = join(corePkgDir, 'assets', 'favicon.svg')
    }
  }

  // Detect apple-touch-icon in public directory
  const appleTouchIconPath = join(publicDir, 'apple-touch-icon.png')
  const resolvedAppleTouchIcon = existsSync(appleTouchIconPath) ? appleTouchIconPath : false

  // Resolve asset mappings
  const assets = new Map<string, string[]>()
  if (userConfig.assets) {
    for (const [outputPath, sources] of Object.entries(userConfig.assets)) {
      const resolved = sources.map((source) => resolve(rootDir, source))
      assets.set(outputPath, resolved)
    }
  }

  // Resolve default social image (config > convention > none)
  let socialImage: string | undefined
  if (userConfig.theme?.socialImage) {
    socialImage = userConfig.theme.socialImage
  } else {
    for (const ext of ['png', 'jpg', 'jpeg']) {
      if (existsSync(join(publicDir, `og-image.${ext}`))) {
        socialImage = `og-image.${ext}`
        break
      }
    }
  }

  // Resolve editLink with multi-host support
  let editLink: ResolvedDocsConfig['editLink']
  if (userConfig.editLink) {
    const repo = userConfig.editLink.repo.replace(/\/+$/, '')
    const branch = userConfig.editLink.branch ?? 'main'
    const label = userConfig.editLink.label ?? 'Edit this page'
    // Auto-detect host from repo URL
    let editPattern: string
    if (repo.includes('gitlab.com') || repo.includes('gitlab.')) {
      editPattern = `${repo}/-/edit/${branch}`
    } else if (repo.includes('bitbucket.org') || repo.includes('bitbucket.')) {
      editPattern = `${repo}/src/${branch}`
    } else {
      // Default: GitHub-style
      editPattern = `${repo}/edit/${branch}`
    }
    editLink = { repo, branch, label, editPattern }
  }

  return {
    rootDir,
    contentDir,
    outDir: overrides?.outDir ?? resolve(rootDir, userConfig.outDir ?? 'gh-pages'),
    publicDir,
    basePath,
    homeLink: userConfig.homeLink,
    name: userConfig.name ?? userConfig.title ?? pkgDisplayName ?? packageName,
    title: userConfig.title ?? userConfig.name ?? pkgDisplayName ?? packageName,
    description:
      userConfig.description ?? pkg?.description ?? 'Documentation site powered by @pagesmith/docs',
    origin: userConfig.origin ?? pkg?.homepage ?? gitInfo?.origin ?? 'https://example.com',
    language: userConfig.language ?? 'en',
    footerLinks: userConfig.footerLinks ?? [],
    search: {
      enabled: userConfig.search?.enabled ?? true,
      showImages: userConfig.search?.showImages ?? false,
      showSubResults: userConfig.search?.showSubResults ?? true,
      pagefindFlags: userConfig.search?.pagefindFlags ?? [],
    },
    sidebar: {
      collapsible: userConfig.sidebar?.collapsible ?? true,
    },
    favicon: resolvedFavicon,
    faviconFallback: resolvedFaviconFallback,
    appleTouchIcon: resolvedAppleTouchIcon,
    editLink,
    lastUpdated: userConfig.lastUpdated ?? false,
    sitemap: userConfig.sitemap ?? true,
    socialImage,
    theme: userConfig.theme,
    analytics: userConfig.analytics,
    markdown: userConfig.markdown,
    homeConfigFile: userConfig.home?.configFile
      ? resolve(rootDir, userConfig.home.configFile)
      : resolve(rootDir, contentDir, 'home.json5'),
    packages: userConfig.packages,
    server: {
      devPort: userConfig.server?.devPort ?? 3000,
      previewPort: userConfig.server?.previewPort ?? 4000,
      strictPort: userConfig.server?.strictPort ?? false,
    },
    assets,
    _userConfig: userConfig,
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

export type ConfigValidationIssue = {
  field: string
  message: string
  severity: 'error' | 'warn'
}

/**
 * Validate a resolved docs config. Returns issues found.
 * Checks required fields, verifies referenced directories and asset files exist.
 */
export function validateConfig(config: ResolvedDocsConfig): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = []

  // Required field checks — only warn when neither name nor title was explicitly set
  // by the user (the resolved config always has a value due to fallback chain).
  const uc = config._userConfig
  const hasExplicitName = uc ? !!(uc.name || uc.title) : config.name !== basename(config.rootDir)
  const hasExplicitTitle = uc ? !!(uc.title || uc.name) : config.title !== basename(config.rootDir)

  if (!hasExplicitName) {
    issues.push({
      field: 'name',
      message: 'Missing "name" in pagesmith.config.json5 — using directory name as fallback.',
      severity: 'warn',
    })
  }

  if (!hasExplicitTitle) {
    issues.push({
      field: 'title',
      message: 'Missing "title" in pagesmith.config.json5 — using directory name as fallback.',
      severity: 'warn',
    })
  }

  if (config.description === 'Documentation site powered by @pagesmith/docs') {
    issues.push({
      field: 'description',
      message: 'Missing "description" in pagesmith.config.json5 — using default placeholder.',
      severity: 'warn',
    })
  }

  if (config.origin === 'https://example.com') {
    issues.push({
      field: 'origin',
      message:
        'Missing "origin" in pagesmith.config.json5 — canonical URLs will use https://example.com. Set this to your production URL.',
      severity: 'warn',
    })
  }

  // Directory existence checks
  if (!existsSync(config.contentDir)) {
    issues.push({
      field: 'contentDir',
      message: `Content directory does not exist: ${config.contentDir}`,
      severity: 'error',
    })
  }

  if (!existsSync(config.publicDir)) {
    // publicDir is optional — just a quiet info, not even a warn
  }

  // Asset mapping checks
  for (const [outputPath, sources] of config.assets) {
    for (const sourcePath of sources) {
      if (!existsSync(sourcePath)) {
        issues.push({
          field: `assets["${outputPath}"]`,
          message: `Asset source does not exist: ${sourcePath}`,
          severity: 'error',
        })
      }
    }
  }

  // Favicon check
  if (typeof config.favicon === 'string' && !existsSync(config.favicon)) {
    issues.push({
      field: 'favicon',
      message: `Favicon file does not exist: ${config.favicon}`,
      severity: 'warn',
    })
  }

  // Layout override checks
  if (config.theme?.layouts) {
    for (const [layoutName, layoutPath] of Object.entries(config.theme.layouts)) {
      const resolvedLayout = resolve(config.rootDir, layoutPath)
      if (!existsSync(resolvedLayout)) {
        issues.push({
          field: `theme.layouts.${layoutName}`,
          message: `Layout file does not exist: ${resolvedLayout}`,
          severity: 'error',
        })
      }
    }
  }

  return issues
}

/**
 * Log validation issues to console. Returns true if there are any errors (severity: 'error').
 */
export function reportConfigIssues(issues: ConfigValidationIssue[]): boolean {
  let hasErrors = false
  for (const issue of issues) {
    if (issue.severity === 'error') {
      console.error(`\x1b[31m✗ [${issue.field}]\x1b[0m ${issue.message}`)
      hasErrors = true
    } else {
      console.warn(`\x1b[33m⚠ [${issue.field}]\x1b[0m ${issue.message}`)
    }
  }
  return hasErrors
}
