import { processMarkdown, type MarkdownConfig } from '@pagesmith/core/markdown'
import type { Heading } from '@pagesmith/core/schemas'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { dirname, extname, join, relative } from 'path'
import { z } from 'zod'
import { readJson5File, toTitleCase, type ResolvedDocsConfig } from './config.js'
import { rehypeAssetTransform } from './markdown/plugins/rehype-asset-transform'

export type NavItem = {
  label: string
  path: string
}

export type SidebarItem = {
  title: string
  path: string
  children?: SidebarItem[]
}

export type SidebarSection = {
  title: string
  slug: string
  collapsed?: boolean
  items: SidebarItem[]
}

export type PrevNextLink = {
  title: string
  path: string
}

export type DocsRootMeta = {
  displayName?: string
  description?: string
  headerLinks?: Array<{ label: string; path: string }>
  footerLinks?: Array<{ label: string; path: string }>
}

export type DocsSectionMeta = {
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

export const DocsFrontmatterSchema = z
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

export type DocsFrontmatter = z.infer<typeof DocsFrontmatterSchema>

export type DocsPage = {
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

export type SiteModel = {
  navItems: NavItem[]
  sidebarBySection: Map<string, SidebarSection[]>
  pageByPath: Map<string, DocsPage>
  rootMeta?: DocsRootMeta
  sectionMetas: Map<string, DocsSectionMeta>
}

export const CONTENT_ASSET_EXTS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
])

export function toContentSlug(filePath: string, contentDir: string): string {
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

export function loadRootMeta(contentDir: string): DocsRootMeta | undefined {
  return readJson5File<DocsRootMeta>(join(contentDir, 'meta.json5'))
}

export function loadSectionMetas(contentDir: string): Map<string, DocsSectionMeta> {
  const metas = new Map<string, DocsSectionMeta>()
  if (!existsSync(contentDir)) return metas
  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const meta = readJson5File<DocsSectionMeta>(join(contentDir, entry.name, 'meta.json5'))
    if (meta) metas.set(entry.name, meta)
  }
  return metas
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
          const targetPath = join(dirname(filePath), rawPath)
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

export async function loadDocsPages(
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

export function collectContentAssets(contentDir: string): Map<string, string> {
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
