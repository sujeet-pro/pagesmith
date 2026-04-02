import { copyPublicFiles } from '@pagesmith/core/assets'
import { buildCss } from '@pagesmith/core/css'
import { processMarkdown, type MarkdownConfig } from '@pagesmith/core/markdown'
import type { Heading } from '@pagesmith/core/schemas'
import { exec } from 'child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import JSON5 from 'json5'
import { basename, dirname, extname, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'
import { type WebSocket, WebSocketServer } from 'ws'
import { z } from 'zod'
import { rehypeAssetTransform } from './markdown/plugins/rehype-asset-transform'
import DocHome from '../theme/layouts/DocHome'
import DocNotFound from '../theme/layouts/DocNotFound'
import DocPage from '../theme/layouts/DocPage'

type NavItem = {
  label: string
  path: string
}

type FooterLink = {
  label: string
  path: string
}

type DocsRenderable = (props: any) => unknown

type DocsLayoutRegistry = Record<string, DocsRenderable>

type SidebarItem = {
  title: string
  path: string
  children?: SidebarItem[]
}

type SidebarSection = {
  title: string
  slug: string
  collapsed?: boolean
  items: SidebarItem[]
}

type PrevNextLink = {
  title: string
  path: string
}

type DocsRootMeta = {
  displayName?: string
  description?: string
  headerLinks?: Array<{ label: string; path: string }>
  footerLinks?: Array<{ label: string; path: string }>
}

type DocsSectionMeta = {
  displayName?: string
  description?: string
  layout?: string
  itemLayout?: string
  orderBy?: 'manual' | 'publishedDate'
  /** Start the sidebar section collapsed (only effective when sidebar.collapsible is true) */
  collapsed?: boolean
  items?: string[]
  series?: Array<{
    slug: string
    displayName: string
    shortName?: string
    description?: string
    articles: string[]
  }>
}

const DocsFrontmatterSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    navLabel: z.string().optional(),
    sidebarLabel: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().optional(),
    hero: z.record(z.string(), z.any()).optional(),
    features: z.array(z.record(z.string(), z.any())).optional(),
  })
  .passthrough()

type DocsFrontmatter = z.infer<typeof DocsFrontmatterSchema>

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

type DocsPage = {
  title: string
  routePath: string
  contentSlug: string
  section?: string
  frontmatter: DocsFrontmatter
  html: string
  headings: Heading[]
  sourcePath: string
  isHome: boolean
  layoutName: string
}

type SiteModel = {
  navItems: NavItem[]
  sidebarBySection: Map<string, SidebarSection[]>
  pageByPath: Map<string, DocsPage>
  rootMeta?: DocsRootMeta
  sectionMetas: Map<string, DocsSectionMeta>
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

const CONTENT_ASSET_EXTS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
])

const WS_CLIENT_SCRIPT = `<script>
(function() {
  var ws = new WebSocket('ws://' + location.host + '/__ws');
  ws.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') location.reload();
  };
  ws.onclose = function() {
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>`

function toTitleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function toContentSlug(filePath: string, contentDir: string): string {
  const ext = extname(filePath)
  let slug = relative(contentDir, filePath).replace(/\\/g, '/')

  if (ext) {
    slug = slug.slice(0, -ext.length)
  }

  if (slug === 'README' || slug === 'index') return '/'
  if (slug.endsWith('/README')) slug = slug.slice(0, -7)
  if (slug.endsWith('/index')) slug = slug.slice(0, -6)

  return slug
}

function readJson5File<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON5.parse(readFileSync(filePath, 'utf-8')) as T
}

function loadRootMeta(contentDir: string): DocsRootMeta | undefined {
  return readJson5File<DocsRootMeta>(join(contentDir, 'meta.json5'))
}

function loadSectionMetas(contentDir: string): Map<string, DocsSectionMeta> {
  const metas = new Map<string, DocsSectionMeta>()
  if (!existsSync(contentDir)) return metas
  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const meta = readJson5File<DocsSectionMeta>(join(contentDir, entry.name, 'meta.json5'))
    if (meta) metas.set(entry.name, meta)
  }
  return metas
}

function getPackageDir(): string {
  return resolve(import.meta.dirname, '..')
}

function getThemeRoot(): string {
  return resolve(getPackageDir(), 'theme')
}

function getThemeStylesEntry(): string {
  return resolve(getThemeRoot(), 'styles/main.css')
}

function getThemeRuntimeEntry(): string {
  return resolve(getThemeRoot(), 'runtime/main.ts')
}

async function loadUserThemeModule(
  entryPath: string,
  rootDir: string,
): Promise<Record<string, any>> {
  const { build } = await import('rolldown')
  const { pathToFileURL } = await import('url')

  const cacheDir = join(rootDir, 'node_modules', '.cache', 'pagesmith-docs-layouts')
  mkdirSync(cacheDir, { recursive: true })

  const safeBase = basename(entryPath)
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
  const outFile = join(cacheDir, `${safeBase}-${Date.now()}.mjs`)

  const rolldownBuild = build as any

  await rolldownBuild({
    input: entryPath,
    output: {
      file: outFile,
      format: 'esm',
    },
    platform: 'node',
    logLevel: 'warn',
    external: [/^node:/, /^@pagesmith\//],
    moduleTypes: {
      '.ts': 'ts',
      '.tsx': 'tsx',
    },
  })

  return import(`${pathToFileURL(outFile).href}?t=${Date.now()}`) as Promise<Record<string, any>>
}

async function resolveDocsLayout(
  name: string,
  config: ResolvedDocsConfig,
  fallback?: DocsRenderable,
): Promise<DocsRenderable> {
  const overridePath = config.theme?.layouts?.[name]
  if (!overridePath) {
    if (fallback) return fallback
    throw new Error(
      `Theme layout "${name}" is referenced in meta.json5 but not registered in theme.layouts config`,
    )
  }

  const absolutePath = resolve(config.rootDir, overridePath)
  const module = await loadUserThemeModule(absolutePath, config.rootDir)

  const knownExports: Record<string, string[]> = {
    home: ['default', 'DocHome', 'Home'],
    page: ['default', 'DocPage', 'Page'],
    notFound: ['default', 'DocNotFound', 'NotFound'],
  }
  const exportNames = knownExports[name] ?? ['default', name]

  for (const exportName of exportNames) {
    const candidate = module[exportName]
    if (typeof candidate === 'function') {
      return candidate as DocsRenderable
    }
  }

  throw new Error(
    `Theme layout "${name}" at ${absolutePath} must export a component as default or one of: ${exportNames.join(', ')}`,
  )
}

async function resolveDocsLayouts(
  config: ResolvedDocsConfig,
  sectionMetas?: Map<string, DocsSectionMeta>,
): Promise<DocsLayoutRegistry> {
  const registry: DocsLayoutRegistry = {
    home: await resolveDocsLayout('home', config, DocHome),
    page: await resolveDocsLayout('page', config, DocPage),
    notFound: await resolveDocsLayout('notFound', config, DocNotFound),
  }

  // Collect unique layout names from section metas
  if (sectionMetas) {
    const extraNames = new Set<string>()
    for (const meta of sectionMetas.values()) {
      if (meta.layout && !registry[meta.layout]) extraNames.add(meta.layout)
      if (meta.itemLayout && !registry[meta.itemLayout]) extraNames.add(meta.itemLayout)
    }
    for (const name of extraNames) {
      registry[name] = await resolveDocsLayout(name, config)
    }
  }

  return registry
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
    theme: userConfig.theme,
    analytics: userConfig.analytics,
    markdown: userConfig.markdown,
    homeConfigFile: userConfig.home?.configFile
      ? resolve(rootDir, userConfig.home.configFile)
      : resolve(rootDir, 'content/home.json5'),
    packages: userConfig.packages,
  }
}

function collectMarkdownFiles(contentDir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string): void {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  if (existsSync(contentDir)) {
    walk(contentDir)
  }

  return files.sort()
}

function createRelativeLinkTransform(filePath: string, contentDir: string, basePath: string) {
  return () => (tree: any) => {
    const visit = (node: any): void => {
      if (node?.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href
        if (typeof href === 'string' && href.includes('.md') && !href.startsWith('http')) {
          // Transform .md references to route paths
          const [rawPath, hash = ''] = href.split('#')
          const targetPath = resolve(dirname(filePath), rawPath)
          const slug = toContentSlug(targetPath, contentDir)
          const routePath = slug === '/' ? '/' : `/${slug}/`
          const fullPath = `${basePath}${routePath}`
          node.properties = node.properties || {}
          node.properties.href = hash ? `${fullPath}#${hash}` : fullPath
        } else if (
          basePath &&
          typeof href === 'string' &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.startsWith(basePath)
        ) {
          // Prefix absolute internal links with basePath
          node.properties = node.properties || {}
          node.properties.href = `${basePath}${href}`
        }
      }

      if (Array.isArray(node?.children)) {
        for (const child of node.children) {
          visit(child)
        }
      }
    }

    visit(tree)
  }
}

async function loadDocsPages(
  config: ResolvedDocsConfig,
  sectionMetas?: Map<string, DocsSectionMeta>,
): Promise<DocsPage[]> {
  const pages: DocsPage[] = []
  const homeConfig = config.homeConfigFile
    ? readJson5File<Record<string, unknown>>(config.homeConfigFile)
    : undefined

  for (const filePath of collectMarkdownFiles(config.contentDir)) {
    const raw = readFileSync(filePath, 'utf-8')
    const markdownConfig: MarkdownConfig = {
      ...(config.markdown ?? {}),
      rehypePlugins: [
        ...(config.markdown?.rehypePlugins ?? []),
        [rehypeAssetTransform, { contentDir: dirname(filePath) }] as const,
        createRelativeLinkTransform(filePath, config.contentDir, config.basePath),
      ],
    }

    const result = await processMarkdown(raw, markdownConfig)
    const parsedFrontmatter = DocsFrontmatterSchema.parse(result.frontmatter ?? {})
    const contentSlug = toContentSlug(filePath, config.contentDir)
    const isHome = contentSlug === '/'

    const frontmatter =
      isHome && homeConfig ? { ...homeConfig, ...parsedFrontmatter } : parsedFrontmatter
    if (frontmatter.draft) continue

    const routePath = isHome ? '/' : `/${contentSlug}`
    const section = isHome ? undefined : contentSlug.split('/')[0]
    const title =
      frontmatter.title ??
      (isHome ? config.title : toTitleCase(contentSlug.split('/').at(-1) ?? section ?? 'Home'))

    // Resolve layout name from section meta
    const sectionMeta = section ? sectionMetas?.get(section) : undefined
    const isLanding = section != null && contentSlug === section
    let layoutName: string
    if (isHome) {
      layoutName = 'home'
    } else if (isLanding && sectionMeta?.layout) {
      layoutName = sectionMeta.layout
    } else if (!isLanding && sectionMeta?.itemLayout) {
      layoutName = sectionMeta.itemLayout
    } else {
      layoutName = 'page'
    }

    pages.push({
      title,
      routePath,
      contentSlug,
      section,
      frontmatter,
      html: result.html,
      headings: result.headings,
      sourcePath: filePath,
      isHome,
      layoutName,
    })
  }

  return pages.sort((left, right) => left.routePath.localeCompare(right.routePath))
}

function getOrder(page: DocsPage): number {
  return typeof page.frontmatter.order === 'number'
    ? page.frontmatter.order
    : Number.MAX_SAFE_INTEGER
}

function sortPages(pages: DocsPage[]): DocsPage[] {
  return [...pages].sort((left, right) => {
    const orderDelta = getOrder(left) - getOrder(right)
    if (orderDelta !== 0) return orderDelta
    return left.routePath.localeCompare(right.routePath)
  })
}

function sortSectionPages(pages: DocsPage[], meta?: DocsSectionMeta): DocsPage[] {
  if (!meta?.orderBy) return sortPages(pages)

  if (meta.orderBy === 'publishedDate') {
    const getPublishedTime = (value: unknown): number => {
      if (!value) return 0
      if (value instanceof Date) return value.getTime()
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value).getTime()
      }
      return 0
    }

    return [...pages].sort((a, b) => {
      const dateA = getPublishedTime(a.frontmatter.publishedDate)
      const dateB = getPublishedTime(b.frontmatter.publishedDate)
      return dateB - dateA
    })
  }

  if (meta.orderBy === 'manual' && meta.items) {
    const order = new Map(meta.items.map((slug, i) => [slug, i]))
    return [...pages].sort((a, b) => {
      const slugA = a.contentSlug.split('/').pop() ?? ''
      const slugB = b.contentSlug.split('/').pop() ?? ''
      const posA = order.get(slugA) ?? Number.MAX_SAFE_INTEGER
      const posB = order.get(slugB) ?? Number.MAX_SAFE_INTEGER
      return posA - posB
    })
  }

  return sortPages(pages)
}

function buildSidebarWithSeries(
  sectionSlug: string,
  sectionPages: DocsPage[],
  meta: DocsSectionMeta,
  basePath: string,
): SidebarSection[] {
  const sections: SidebarSection[] = []
  const pageBySlug = new Map(sectionPages.map((p) => [p.contentSlug.split('/').pop(), p]))
  const landing = sectionPages.find((p) => p.contentSlug === sectionSlug)

  for (const series of meta.series!) {
    const items: SidebarItem[] = series.articles
      .map((slug) => pageBySlug.get(slug))
      .filter((p): p is DocsPage => p != null)
      .map((page) => ({
        title: page.frontmatter.sidebarLabel ?? page.title,
        path: `${basePath}${page.routePath}`,
      }))

    if (items.length > 0) {
      sections.push({ title: series.displayName, slug: series.slug, items })
    }
  }

  // Prepend landing page to first section if exists
  if (landing && sections.length > 0) {
    sections[0].items.unshift({
      title: landing.frontmatter.sidebarLabel ?? landing.title,
      path: `${basePath}${landing.routePath}`,
    })
  }

  return sections
}

function buildSidebarItems(
  sectionSlug: string,
  sectionPages: DocsPage[],
  basePath: string,
  sectionMeta?: DocsSectionMeta,
): SidebarItem[] {
  type Node = {
    key: string
    title: string
    path: string
    order: number
    children: Map<string, Node>
  }

  const roots = new Map<string, Node>()
  const landingPage = sectionPages.find((page) => page.contentSlug === sectionSlug)

  for (const page of sortSectionPages(
    sectionPages.filter((entry) => entry.contentSlug !== sectionSlug),
    sectionMeta,
  )) {
    const remainder = page.contentSlug.slice(sectionSlug.length + 1)
    if (!remainder) continue

    const segments = remainder.split('/')
    let level = roots
    let accumulated = sectionSlug

    for (const [index, segment] of segments.entries()) {
      accumulated = `${accumulated}/${segment}`
      let node = level.get(segment)
      if (!node) {
        node = {
          key: accumulated,
          title: toTitleCase(segment),
          path: `${basePath}${page.routePath}`,
          order: getOrder(page),
          children: new Map<string, Node>(),
        }
        level.set(segment, node)
      }

      if (index === segments.length - 1) {
        node.title = page.frontmatter.sidebarLabel ?? page.title
        node.path = `${basePath}${page.routePath}`
        node.order = getOrder(page)
      }

      level = node.children
    }
  }

  const toItems = (nodes: Map<string, Node>): SidebarItem[] =>
    Array.from(nodes.values())
      .sort((left, right) => {
        const orderDelta = left.order - right.order
        if (orderDelta !== 0) return orderDelta
        return left.title.localeCompare(right.title)
      })
      .map((node) => ({
        title: node.title,
        path: node.path,
        ...(node.children.size > 0 ? { children: toItems(node.children) } : {}),
      }))

  const items = toItems(roots)

  if (!landingPage) {
    return items
  }

  return [
    {
      title: landingPage.frontmatter.sidebarLabel ?? landingPage.title,
      path: `${basePath}${landingPage.routePath}`,
    },
    ...items,
  ]
}

/**
 * Find the first content page in a section, respecting meta ordering.
 * Excludes the landing page (README.md) itself — returns the first "child" page.
 */
function findFirstSectionPage(
  sectionSlug: string,
  sectionPages: DocsPage[],
  meta?: DocsSectionMeta,
): DocsPage | undefined {
  const nonLanding = sectionPages.filter((p) => p.contentSlug !== sectionSlug)
  if (nonLanding.length === 0) return undefined

  // For manual ordering with series, the first article of the first series wins
  if (meta?.orderBy === 'manual' && meta.series && meta.series.length > 0) {
    const pageBySlug = new Map(nonLanding.map((p) => [p.contentSlug.split('/').pop(), p]))
    for (const series of meta.series) {
      for (const slug of series.articles) {
        const page = pageBySlug.get(slug)
        if (page) return page
      }
    }
  }

  // For manual ordering with items array
  if (meta?.orderBy === 'manual' && meta.items && meta.items.length > 0) {
    const pageBySlug = new Map(nonLanding.map((p) => [p.contentSlug.split('/').pop(), p]))
    for (const slug of meta.items) {
      const page = pageBySlug.get(slug)
      if (page) return page
    }
  }

  // Default: use sortSectionPages
  return sortSectionPages(nonLanding, meta)[0]
}

function buildSiteModel(
  config: ResolvedDocsConfig,
  pages: DocsPage[],
  rootMeta?: DocsRootMeta,
  sectionMetas?: Map<string, DocsSectionMeta>,
): SiteModel {
  const pageByPath = new Map(pages.map((page) => [page.routePath, page]))
  const sidebarBySection = new Map<string, SidebarSection[]>()
  const navItems: NavItem[] = []
  const pagesBySection = new Map<string, DocsPage[]>()

  for (const page of pages) {
    if (!page.section) continue
    if (!pagesBySection.has(page.section)) {
      pagesBySection.set(page.section, [])
    }
    pagesBySection.get(page.section)!.push(page)
  }

  for (const [sectionSlug, sectionPages] of Array.from(pagesBySection.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const sectionMeta = sectionMetas?.get(sectionSlug)
    const landingPage = sectionPages.find((page) => page.contentSlug === sectionSlug)
    const firstPage = findFirstSectionPage(sectionSlug, sectionPages, sectionMeta)
    const label =
      sectionMeta?.displayName ??
      config.packages?.[sectionSlug]?.label ??
      landingPage?.frontmatter.navLabel ??
      landingPage?.title ??
      firstPage?.frontmatter.navLabel ??
      toTitleCase(sectionSlug)
    const sectionPath = landingPage?.routePath ?? firstPage?.routePath ?? `/${sectionSlug}`

    // Only auto-generate nav items if root meta didn't provide explicit headerLinks
    if (!rootMeta?.headerLinks || rootMeta.headerLinks.length === 0) {
      navItems.push({ label, path: `${config.basePath}${sectionPath}` })
    }

    // Build sidebar: use series grouping if defined, otherwise flat list
    if (sectionMeta?.series && sectionMeta.series.length > 0) {
      sidebarBySection.set(
        sectionSlug,
        buildSidebarWithSeries(sectionSlug, sectionPages, sectionMeta, config.basePath),
      )
    } else {
      sidebarBySection.set(sectionSlug, [
        {
          title: label,
          slug: sectionSlug,
          collapsed: sectionMeta?.collapsed,
          items: buildSidebarItems(sectionSlug, sectionPages, config.basePath, sectionMeta),
        },
      ])
    }
  }

  // If root meta provides explicit header links, resolve section paths to actual pages
  if (rootMeta?.headerLinks && rootMeta.headerLinks.length > 0) {
    for (const link of rootMeta.headerLinks) {
      const rawPath = link.path.startsWith('/') ? link.path : `/${link.path}`
      const sectionSlug = rawPath.replace(/^\//, '').replace(/\/.*$/, '')
      const sectionPages = pagesBySection.get(sectionSlug)
      let resolvedPath = rawPath

      if (sectionPages) {
        const landing = sectionPages.find((p) => p.contentSlug === sectionSlug)
        if (landing) {
          resolvedPath = landing.routePath
        } else {
          const first = findFirstSectionPage(
            sectionSlug,
            sectionPages,
            sectionMetas?.get(sectionSlug),
          )
          if (first) resolvedPath = first.routePath
        }
      }

      navItems.push({
        label: link.label,
        path: `${config.basePath}${resolvedPath}`,
      })
    }
  }

  return {
    navItems,
    sidebarBySection,
    pageByPath,
    rootMeta,
    sectionMetas: sectionMetas ?? new Map(),
  }
}

function flattenSidebarItems(items: SidebarItem[]): SidebarItem[] {
  const flattened: SidebarItem[] = []

  for (const item of items) {
    flattened.push(item)
    if (item.children) {
      flattened.push(...flattenSidebarItems(item.children))
    }
  }

  return flattened
}

function getPrevNext(
  sidebarSections: SidebarSection[] | undefined,
  routePath: string,
): { prev?: PrevNextLink; next?: PrevNextLink } {
  if (!sidebarSections?.length) return {}
  const flat = flattenSidebarItems(sidebarSections.flatMap((section) => section.items))
  const index = flat.findIndex((item) => item.path === routePath)
  if (index < 0) return {}

  const prev = index > 0 ? flat[index - 1] : undefined
  const next = index < flat.length - 1 ? flat[index + 1] : undefined

  return {
    prev: prev ? { title: prev.title, path: prev.path } : undefined,
    next: next ? { title: next.title, path: next.path } : undefined,
  }
}

function getSitePayload(config: ResolvedDocsConfig, model: SiteModel) {
  const base = config.basePath

  // Use root meta footer links if provided, otherwise config footer links
  const rawFooterLinks = model.rootMeta?.footerLinks ?? config.footerLinks

  // Prefix internal footer link paths with basePath
  const footerLinks = base
    ? rawFooterLinks.map((link) => ({
        ...link,
        path:
          link.path.startsWith('/') && !link.path.startsWith('//') && !link.path.startsWith(base)
            ? `${base}${link.path}`
            : link.path,
      }))
    : rawFooterLinks

  return {
    origin: config.origin,
    basePath: config.basePath,
    homeLink: config.homeLink,
    name: config.name,
    title: config.title,
    description: config.description,
    language: config.language,
    navItems: model.navItems,
    footerLinks,
    search: config.search,
    sidebar: config.sidebar,
    analytics: config.analytics,
    theme: config.theme,
  }
}

function collectContentAssets(contentDir: string): Map<string, string> {
  const assets = new Map<string, string>()

  function walk(currentDir: string): void {
    if (!existsSync(currentDir)) return

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue

      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      if (!CONTENT_ASSET_EXTS.has(extname(entry.name).toLowerCase())) continue

      if (assets.has(entry.name) && assets.get(entry.name) !== fullPath) {
        console.warn(
          `pagesmith:docs duplicate companion asset basename "${entry.name}" detected; using ${fullPath}`,
        )
      }

      assets.set(entry.name, fullPath)
    }
  }

  walk(contentDir)
  return assets
}

function copyContentAssets(outDir: string, assets: Map<string, string>): void {
  if (assets.size === 0) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  for (const [fileName, sourcePath] of assets) {
    copyFileSync(sourcePath, join(assetsDir, fileName))
  }
}

async function bundleThemeAssets(config: ResolvedDocsConfig): Promise<void> {
  const assetsDir = join(config.outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  const css = buildCss(getThemeStylesEntry(), { minify: true })
  writeFileSync(join(assetsDir, 'style.css'), css)

  const { build } = await import('rolldown')
  await build({
    input: getThemeRuntimeEntry(),
    output: {
      dir: assetsDir,
      entryFileNames: 'main.js',
      format: 'esm',
      minify: true,
    },
    platform: 'browser',
    logLevel: 'warn',
  })

  // Copy bundled font files to assets/fonts/
  const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
  const coreFontsDir = join(corePkgDir, 'assets', 'fonts')
  const outFontsDir = join(assetsDir, 'fonts')
  mkdirSync(outFontsDir, { recursive: true })
  for (const file of readdirSync(coreFontsDir)) {
    if (file.endsWith('.woff2')) {
      copyFileSync(join(coreFontsDir, file), join(outFontsDir, file))
    }
  }
}

function copyPublicAssets(config: ResolvedDocsConfig): void {
  copyPublicFiles(config.publicDir, config.outDir)
}

async function runPagefind(outDir: string, extraFlags: string[] = []): Promise<void> {
  // Resolve pagefind's main entry via import.meta.resolve (works with exports-only packages)
  const { fileURLToPath } = await import('url')
  const mainUrl = import.meta.resolve('pagefind')
  const mainPath = fileURLToPath(mainUrl)
  const pagefindRoot = join(mainPath, '..', '..')
  const binaryPath = join(pagefindRoot, 'lib', 'runner', 'bin.cjs')

  const { execFileSync } = await import('child_process')
  execFileSync(process.execPath, [binaryPath, '--site', outDir, ...extraFlags], {
    stdio: 'inherit',
  })
}

function writeHtml(outDir: string, routePath: string, html: string): void {
  const outputPath =
    routePath === '/' ? join(outDir, 'index.html') : join(outDir, routePath.slice(1), 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `<!DOCTYPE html>\n${html}`)
}

async function renderDocs(config: ResolvedDocsConfig): Promise<void> {
  const rootMeta = loadRootMeta(config.contentDir)
  const sectionMetas = loadSectionMetas(config.contentDir)
  const pages = await loadDocsPages(config, sectionMetas)
  const model = buildSiteModel(config, pages, rootMeta, sectionMetas)
  const site = getSitePayload(config, model)
  const layouts = await resolveDocsLayouts(config, sectionMetas)

  const base = config.basePath

  for (const page of pages) {
    const urlPath = `${base}${page.routePath}`

    if (page.isHome) {
      // Prefix internal hero action links with basePath
      const frontmatter = { ...page.frontmatter }
      if (frontmatter.hero?.actions) {
        frontmatter.hero = {
          ...frontmatter.hero,
          actions: frontmatter.hero.actions.map((a: any) => ({
            ...a,
            link:
              typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
          })),
        }
      }
      const homeActions = Array.isArray(frontmatter.actions) ? frontmatter.actions : undefined
      if (homeActions) {
        frontmatter.actions = homeActions.map((a: any) => ({
          ...a,
          link: typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
        }))
      }

      const layout = layouts[page.layoutName] ?? layouts.home
      const output = layout({
        content: page.html,
        frontmatter,
        headings: page.headings,
        slug: urlPath,
        site,
      })
      writeHtml(config.outDir, page.routePath, String(output))
      continue
    }

    const sidebarSections = page.section ? model.sidebarBySection.get(page.section) : undefined
    const { prev, next } = getPrevNext(sidebarSections, urlPath)
    const layout = layouts[page.layoutName] ?? layouts.page
    const output = layout({
      content: page.html,
      frontmatter: page.frontmatter,
      headings: page.headings,
      slug: urlPath,
      site,
      sidebarSections,
      prev,
      next,
    })
    writeHtml(config.outDir, page.routePath, String(output))
  }

  const notFound = layouts.notFound({
    content: '',
    frontmatter: {
      title: 'Page not found',
      description: 'The page you requested could not be found.',
    },
    headings: [],
    slug: `${base}/404`,
    site,
  })
  const notFoundHtml = `<!DOCTYPE html>\n${String(notFound)}`
  writeHtml(config.outDir, '/404', String(notFound))
  // Also write 404.html at root for GitHub Pages
  writeFileSync(join(config.outDir, '404.html'), notFoundHtml)
}

export async function build(options: DocsBuildOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })

  if (existsSync(config.outDir)) {
    rmSync(config.outDir, { recursive: true, force: true })
  }
  mkdirSync(config.outDir, { recursive: true })

  const contentAssets = collectContentAssets(config.contentDir)

  await bundleThemeAssets(config)
  await renderDocs(config)
  copyPublicAssets(config)
  copyContentAssets(config.outDir, contentAssets)

  if (config.search.enabled) {
    await runPagefind(config.outDir, config.search.pagefindFlags)
  }
}

function serveFile(
  filePath: string,
  res: ServerResponse,
  injectReload = false,
  statusCode = 200,
): void {
  const ext = extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  const body = readFileSync(filePath)

  if (ext === '.html' && injectReload) {
    const html = body.toString().replace('</body>', `${WS_CLIENT_SCRIPT}</body>`)
    res.writeHead(statusCode, { 'Content-Type': contentType })
    res.end(html)
    return
  }

  res.writeHead(statusCode, { 'Content-Type': contentType })
  res.end(body)
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
}

export async function startDev(options: DocsDevOptions = {}): Promise<void> {
  const configPath = resolve(options.configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const port = options.port ?? 3001

  await build({ configPath })
  const config = resolveDocsConfig(configPath)
  const watchTargets = [config.contentDir, configPath, getThemeRoot()]
  if (existsSync(config.publicDir)) {
    watchTargets.push(config.publicDir)
  }

  let rebuilding = false
  let pending = false
  const clients = new Set<WebSocket>()

  const base = config.basePath.replace(/\/+$/, '')

  function log(status: number, method: string, pathname: string): void {
    const color = status < 300 ? '\x1b[32m' : status < 400 ? '\x1b[36m' : '\x1b[33m'
    console.log(`  ${color}${status}\x1b[0m ${method} ${pathname}`)
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    const method = req.method || 'GET'
    let pathname = url.pathname

    // Redirect root to basePath
    if (base && (pathname === '/' || pathname === '')) {
      log(302, method, pathname)
      res.writeHead(302, { Location: `${base}/` })
      res.end()
      return
    }

    // Strip basePath prefix so file lookup matches outDir structure
    if (base && pathname.startsWith(base)) {
      pathname = pathname.slice(base.length) || '/'
    }

    // Serve font files from core assets during dev
    if (pathname.startsWith('/assets/fonts/')) {
      const fontFile = pathname.replace('/assets/fonts/', '')
      const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
      const fontPath = join(corePkgDir, 'assets', 'fonts', fontFile)
      if (existsSync(fontPath)) {
        log(200, method, url.pathname)
        res.writeHead(200, {
          'Content-Type': 'font/woff2',
          'Cache-Control': 'public, max-age=31536000',
        })
        res.end(readFileSync(fontPath))
        return
      }
    }

    let filePath = join(config.outDir, pathname)

    if (existsSync(filePath) && !extname(filePath)) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      // Try 404/index.html then 404.html (GitHub Pages convention)
      const notFoundDir = join(config.outDir, '404', 'index.html')
      const notFoundFile = join(config.outDir, '404.html')
      const notFoundPath = existsSync(notFoundDir)
        ? notFoundDir
        : existsSync(notFoundFile)
          ? notFoundFile
          : null
      if (notFoundPath) {
        log(404, method, url.pathname)
        serveFile(notFoundPath, res, true, 404)
        return
      }
      log(404, method, url.pathname)
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>404</h1>')
      return
    }

    log(200, method, url.pathname)
    serveFile(filePath, res, true)
  })

  const wss = new WebSocketServer({ server, path: '/__ws' })
  wss.on('connection', (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
  })

  const devUrl = `http://localhost:${port}${base}/`
  server.listen(port, () => {
    console.log(`\nDocs dev server: ${devUrl}\n`)
    if (options.open) openBrowser(devUrl)
  })

  const watcher = watch(watchTargets, { ignoreInitial: true })
  watcher.on('all', async () => {
    if (rebuilding) {
      pending = true
      return
    }

    rebuilding = true
    try {
      await build({ configPath })
      const payload = JSON.stringify({ type: 'reload' })
      for (const client of clients) {
        client.send(payload)
      }
    } finally {
      rebuilding = false
      if (pending) {
        pending = false
        await build({ configPath })
      }
    }
  })
}

export async function preview(options: DocsDevOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath)
  const port = options.port ?? 4173
  const previewBase = config.basePath.replace(/\/+$/, '')

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    let pathname = url.pathname

    // Redirect root to basePath
    if (previewBase && (pathname === '/' || pathname === '')) {
      res.writeHead(302, { Location: `${previewBase}/` })
      res.end()
      return
    }

    // Strip basePath prefix
    if (previewBase && pathname.startsWith(previewBase)) {
      pathname = pathname.slice(previewBase.length) || '/'
    }

    let filePath = join(config.outDir, pathname)

    if (existsSync(filePath) && !extname(filePath)) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      filePath = join(config.outDir, '404', 'index.html')
      if (!existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
      serveFile(filePath, res, false, 404)
      return
    }

    serveFile(filePath, res)
  })

  server.listen(port, () => {
    console.log(`\nDocs preview: http://localhost:${port}${previewBase}/\n`)
  })
}
