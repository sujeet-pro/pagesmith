import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import JSON5 from 'json5'
import { basename, dirname, join, resolve } from 'path'
import type { DocsUserConfig, GitOriginInfo, ResolvedDocsConfig } from './types'

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

/** Detect basePath and origin from git remote URL. */
export function detectGitOrigin(rootDir: string): GitOriginInfo | undefined {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    }).trim()

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

function generateDefaultFavicon(letter: string): string {
  const cacheDir = join(tmpdir(), 'pagesmith-favicon', letter)
  const filePath = join(cacheDir, 'favicon.svg')
  if (!existsSync(filePath)) {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
      '  <rect width="32" height="32" rx="6" fill="#111"/>',
      `  <text x="16" y="24" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="20" font-weight="700">${letter}</text>`,
      '</svg>',
      '',
    ].join('\n')
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(filePath, svg)
  }
  return filePath
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
  const gitInfo = detectGitOrigin(rootDir)

  const rawBase =
    overrides?.basePath ?? process.env.BASE_URL ?? userConfig.basePath ?? gitInfo?.basePath ?? '/'
  const basePath = rawBase.replace(/\/+$/, '')
  const contentDir = resolveContentDir(rootDir, userConfig.contentDir)
  const publicDir = resolve(rootDir, userConfig.publicDir ?? 'public')
  const siteName = userConfig.name ?? userConfig.title ?? pkgDisplayName ?? packageName

  let resolvedFavicon: string | false
  let resolvedFaviconFallback: string | false = false
  if (userConfig.favicon === false) {
    resolvedFavicon = false
  } else if (typeof userConfig.favicon === 'string') {
    resolvedFavicon = resolve(rootDir, userConfig.favicon)
  } else {
    const svgPath = join(publicDir, 'favicon.svg')
    const icoPath = join(publicDir, 'favicon.ico')
    if (existsSync(svgPath)) {
      resolvedFavicon = svgPath
      if (existsSync(icoPath)) {
        resolvedFaviconFallback = icoPath
      }
    } else if (existsSync(icoPath)) {
      resolvedFavicon = icoPath
    } else {
      const letter = (siteName.charAt(0) || 'P').toUpperCase()
      resolvedFavicon = generateDefaultFavicon(letter)
    }
  }

  let resolvedIcon: string | false
  if (userConfig.icon === false) {
    resolvedIcon = false
  } else if (typeof userConfig.icon === 'string') {
    if (userConfig.icon.trimStart().startsWith('<')) {
      resolvedIcon = userConfig.icon
    } else {
      const iconPath = resolve(rootDir, userConfig.icon)
      resolvedIcon = existsSync(iconPath) ? readFileSync(iconPath, 'utf-8') : false
    }
  } else {
    const letter = (siteName.charAt(0) || 'P').toUpperCase()
    resolvedIcon = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
      '  <rect width="32" height="32" rx="6" fill="#111"/>',
      `  <text x="16" y="24" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="20" font-weight="700">${letter}</text>`,
      '</svg>',
    ].join('')
  }

  const appleTouchIconPath = join(publicDir, 'apple-touch-icon.png')
  const resolvedAppleTouchIcon = existsSync(appleTouchIconPath) ? appleTouchIconPath : false

  const assets = new Map<string, string[]>()
  if (userConfig.assets) {
    for (const [outputPath, sources] of Object.entries(userConfig.assets)) {
      const resolvedSources = sources.map((source) => resolve(rootDir, source))
      assets.set(outputPath, resolvedSources)
    }
  }

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

  let editLink: ResolvedDocsConfig['editLink']
  if (userConfig.editLink) {
    const repo = userConfig.editLink.repo.replace(/\/+$/, '')
    const branch = userConfig.editLink.branch ?? 'main'
    const label = userConfig.editLink.label ?? 'Edit this page'
    let editPattern: string
    if (repo.includes('gitlab.com') || repo.includes('gitlab.')) {
      editPattern = `${repo}/-/edit/${branch}`
    } else if (repo.includes('bitbucket.org') || repo.includes('bitbucket.')) {
      editPattern = `${repo}/src/${branch}`
    } else {
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
    name: siteName,
    title: userConfig.title ?? siteName,
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
    icon: resolvedIcon,
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
