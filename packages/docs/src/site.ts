import { buildCss } from '@pagesmith/core/css'
import { processMarkdown, type MarkdownConfig } from '@pagesmith/core/markdown'
import type { Heading } from '@pagesmith/core/schemas'
import { exec } from 'child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import JSON5 from 'json5'
import { basename, dirname, extname, join, relative, resolve } from 'path'
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

type SidebarItem = {
  title: string
  path: string
  children?: SidebarItem[]
}

type SidebarSection = {
  title: string
  slug: string
  items: SidebarItem[]
}

type PrevNextLink = {
  title: string
  path: string
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
  footerLinks?: FooterLink[]
  search?: {
    enabled?: boolean
  }
  theme?: {
    lightColor?: string
    darkColor?: string
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
  name: string
  title: string
  description: string
  origin: string
  language: string
  footerLinks: FooterLink[]
  search: {
    enabled: boolean
  }
  theme?: {
    lightColor?: string
    darkColor?: string
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
}

type SiteModel = {
  navItems: NavItem[]
  sidebarBySection: Map<string, SidebarSection[]>
  pageByPath: Map<string, DocsPage>
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
    name: userConfig.name ?? userConfig.title ?? packageName,
    title: userConfig.title ?? userConfig.name ?? packageName,
    description: userConfig.description ?? 'Documentation site powered by @pagesmith/docs',
    origin: userConfig.origin ?? 'https://example.com',
    language: userConfig.language ?? 'en',
    footerLinks: userConfig.footerLinks ?? [],
    search: {
      enabled: userConfig.search?.enabled ?? true,
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

async function loadDocsPages(config: ResolvedDocsConfig): Promise<DocsPage[]> {
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

function buildSidebarItems(sectionSlug: string, sectionPages: DocsPage[], basePath: string): SidebarItem[] {
  type Node = {
    key: string
    title: string
    path: string
    order: number
    children: Map<string, Node>
  }

  const roots = new Map<string, Node>()
  const landingPage = sectionPages.find((page) => page.contentSlug === sectionSlug)

  for (const page of sortPages(sectionPages.filter((entry) => entry.contentSlug !== sectionSlug))) {
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

function buildSiteModel(config: ResolvedDocsConfig, pages: DocsPage[]): SiteModel {
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
    const landingPage = sectionPages.find((page) => page.contentSlug === sectionSlug)
    const firstPage = sortPages(sectionPages)[0]
    const label =
      config.packages?.[sectionSlug]?.label ??
      landingPage?.frontmatter.navLabel ??
      landingPage?.title ??
      firstPage?.frontmatter.navLabel ??
      toTitleCase(sectionSlug)
    const path = landingPage?.routePath ?? firstPage?.routePath ?? `/${sectionSlug}`

    navItems.push({ label, path: `${config.basePath}${path}` })
    sidebarBySection.set(sectionSlug, [
      {
        title: label,
        slug: sectionSlug,
        items: buildSidebarItems(sectionSlug, sectionPages, config.basePath),
      },
    ])
  }

  return {
    navItems,
    sidebarBySection,
    pageByPath,
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

  // Prefix internal footer link paths with basePath
  const footerLinks = base
    ? config.footerLinks.map((link) => ({
        ...link,
        path:
          link.path.startsWith('/') && !link.path.startsWith('//') && !link.path.startsWith(base)
            ? `${base}${link.path}`
            : link.path,
      }))
    : config.footerLinks

  return {
    origin: config.origin,
    basePath: config.basePath,
    name: config.name,
    title: config.title,
    description: config.description,
    language: config.language,
    navItems: model.navItems,
    footerLinks,
    search: config.search,
    analytics: config.analytics,
    theme: config.theme,
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
}

function copyPublicAssets(config: ResolvedDocsConfig): void {
  if (!existsSync(config.publicDir)) return
  cpSync(config.publicDir, config.outDir, { recursive: true })
}

async function runPagefind(outDir: string): Promise<void> {
  // Resolve pagefind's main entry via import.meta.resolve (works with exports-only packages)
  const { fileURLToPath } = await import('url')
  const mainUrl = import.meta.resolve('pagefind')
  const mainPath = fileURLToPath(mainUrl)
  const pagefindRoot = join(mainPath, '..', '..')
  const binaryPath = join(pagefindRoot, 'lib', 'runner', 'bin.cjs')

  const { execFileSync } = await import('child_process')
  execFileSync(process.execPath, [binaryPath, '--site', outDir], { stdio: 'inherit' })
}

function writeHtml(outDir: string, routePath: string, html: string): void {
  const outputPath =
    routePath === '/' ? join(outDir, 'index.html') : join(outDir, routePath.slice(1), 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `<!DOCTYPE html>\n${html}`)
}

async function renderDocs(config: ResolvedDocsConfig): Promise<void> {
  const pages = await loadDocsPages(config)
  const model = buildSiteModel(config, pages)
  const site = getSitePayload(config, model)

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
            link: typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
          })),
        }
      }
      if (frontmatter.actions) {
        frontmatter.actions = frontmatter.actions.map((a: any) => ({
          ...a,
          link: typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
        }))
      }

      const output = DocHome({
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
    const output = DocPage({
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

  const notFound = DocNotFound({
    content: '',
    frontmatter: {
      title: 'Page not found',
      description: 'The page you requested could not be found.',
    },
    headings: [],
    slug: `${base}/404`,
    site,
  })
  writeHtml(config.outDir, '/404', String(notFound))
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

  await bundleThemeAssets(config)
  await renderDocs(config)
  copyPublicAssets(config)

  if (config.search.enabled) {
    await runPagefind(config.outDir)
  }
}

function serveFile(filePath: string, res: ServerResponse, injectReload = false): void {
  const ext = extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  const body = readFileSync(filePath)

  if (ext === '.html' && injectReload) {
    const html = body.toString().replace('</body>', `${WS_CLIENT_SCRIPT}</body>`)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(html)
    return
  }

  res.writeHead(200, { 'Content-Type': contentType })
  res.end(body)
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`)
}

export async function startDev(options: DocsDevOptions = {}): Promise<void> {
  const configPath = resolve(options.configPath ?? join(process.cwd(), 'pagesmith.config.json5'))
  const port = options.port ?? 3000

  await build({ configPath })
  const config = resolveDocsConfig(configPath)
  const watchTargets = [config.contentDir, configPath, getThemeRoot()]
  if (existsSync(config.publicDir)) {
    watchTargets.push(config.publicDir)
  }

  let rebuilding = false
  let pending = false
  const clients = new Set<WebSocket>()

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    let filePath = join(config.outDir, url.pathname)

    if (existsSync(filePath) && !extname(filePath)) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      const notFoundPath = join(config.outDir, '404', 'index.html')
      if (existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        serveFile(notFoundPath, res, true)
        return
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>404</h1>')
      return
    }

    serveFile(filePath, res, true)
  })

  const wss = new WebSocketServer({ server, path: '/__ws' })
  wss.on('connection', (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
  })

  const url = `http://localhost:${port}`
  server.listen(port, () => {
    console.log(`\nDocs dev server: ${url}\n`)
    if (options.open) openBrowser(url)
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

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    let filePath = join(config.outDir, url.pathname)

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
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    }

    serveFile(filePath, res)
  })

  server.listen(port, () => {
    console.log(`\nDocs preview: http://localhost:${port}\n`)
  })
}
