import { extractFrontmatter } from '@pagesmith/core'
import { processMarkdown, type MarkdownConfig } from '@pagesmith/core/markdown'
import type { Heading } from '@pagesmith/core/schemas'
import type {
  SiteNavItem as NavItem,
  SitePageLink as PrevNextLink,
  SiteSidebarItem as SidebarItem,
  SiteSidebarSection as SidebarSection,
} from '@pagesmith/site/components'
import { execFileSync } from 'child_process'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { availableParallelism } from 'os'
import { extname, join, relative, resolve } from 'path'
import { collectContentAssets as collectAssets, CONTENT_ASSET_EXTS } from '@pagesmith/core/assets'
import { readJson5File, toTitleCase, type ResolvedDocsConfig } from './config.js'
import { runWithDocsTransformContext } from './markdown/plugins/context.js'
import { rehypeAssetTransform, rehypeLinkTransform } from './markdown/plugins/index.js'
import {
  DocsFrontmatterSchema,
  type DocsFrontmatter,
  type DocsRootMeta,
  type DocsSectionMeta,
} from './schemas/docs-content.js'

export { CONTENT_ASSET_EXTS }
export { DocsFrontmatterSchema } from './schemas/docs-content.js'
export type { DocsFrontmatter, DocsRootMeta, DocsSectionMeta } from './schemas/docs-content.js'
export type { NavItem, SidebarItem, SidebarSection, PrevNextLink }

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
  lastUpdated?: string
}

export type SiteModel = {
  navItems: NavItem[]
  sidebarBySection: Map<string, SidebarSection[]>
  pageByPath: Map<string, DocsPage>
  /** Maps folder slugs to resolved URL paths (with basePath). Folders without an index page resolve to their first child page. */
  folderPaths: Map<string, string>
  rootMeta?: DocsRootMeta
  sectionMetas: Map<string, DocsSectionMeta>
}

function shouldIgnoreContentEntry(name: string): boolean {
  return name.startsWith('.') || name.startsWith('_')
}

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
    if (!entry.isDirectory() || shouldIgnoreContentEntry(entry.name)) continue
    const meta = readJson5File<DocsSectionMeta>(join(contentDir, entry.name, 'meta.json5'))
    if (meta) metas.set(entry.name, meta)
  }
  return metas
}

function collectMarkdownFiles(contentDir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string): void {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (shouldIgnoreContentEntry(entry.name)) continue
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

function resolvePageSection(
  filePath: string,
  contentDir: string,
  isHome: boolean,
): string | undefined {
  if (isHome) return undefined

  const relativePath = relative(contentDir, filePath).replace(/\\/g, '/')
  const segments = relativePath.split('/')

  // Top-level folders define docs categories. Root-level markdown files are still
  // valid pages, but they do not become top-level navigation categories.
  return segments.length > 1 ? segments[0] : undefined
}

const GIT_LOG_MARKER = '__PAGESMITH_COMMIT__'

function getGitLastUpdatedMap(rootDir: string, contentDir: string): Map<string, string> {
  const updated = new Map<string, string>()

  try {
    const target = relative(rootDir, contentDir) || '.'
    const output = execFileSync(
      'git',
      ['log', `--format=${GIT_LOG_MARKER}%n%cI`, '--name-only', '--', target],
      {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )

    let currentDate: string | undefined
    let expectingDate = false

    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue

      if (line === GIT_LOG_MARKER) {
        expectingDate = true
        continue
      }

      if (expectingDate) {
        currentDate = line
        expectingDate = false
        continue
      }

      if (!currentDate) continue
      const filePath = resolve(rootDir, rawLine)
      if (!updated.has(filePath)) {
        updated.set(filePath, currentDate)
      }
    }
  } catch {
    // Git is unavailable, the content directory is outside the repo, or the
    // target path has no tracked history.
  }

  return updated
}

function toDisplaySourcePath(filePath: string, rootDir: string): string {
  const displayPath = relative(rootDir, filePath).replace(/\\/g, '/')
  return displayPath || filePath.replace(/\\/g, '/')
}

function wrapMarkdownFileError(
  filePath: string,
  rootDir: string,
  action: string,
  error: unknown,
): Error {
  const displayPath = toDisplaySourcePath(filePath, rootDir)
  if (error instanceof Error && error.message.includes(displayPath)) {
    return error
  }

  const message =
    error instanceof Error
      ? `${action} in ${displayPath}`
      : `${action} in ${displayPath}: ${String(error)}`

  return new Error(message, {
    cause: error instanceof Error ? error : undefined,
  })
}

function prefixBasePathLinks(html: string, basePath: string): string {
  if (!basePath) return html

  return html.replace(/<a\s[^>]*>/g, (tag) => {
    const hrefMatch = tag.match(/href=(?:"([^"]*)"|'([^']*)')/)
    if (!hrefMatch) return tag

    const href = hrefMatch[1] ?? hrefMatch[2]
    const quote = tag.includes('href="') ? '"' : "'"

    if (
      !href.startsWith('/') ||
      href.startsWith('//') ||
      href === basePath ||
      href.startsWith(`${basePath}/`)
    ) {
      return tag
    }

    return tag.replace(`href=${quote}${href}${quote}`, `href=${quote}${basePath}${href}${quote}`)
  })
}

/**
 * Run async tasks with bounded concurrency.
 * Prevents memory blowup when processing thousands of pages.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

/**
 * Generate breadcrumbs from a content slug.
 * Returns array of { label, path } from root to current page.
 *
 * When `folderPaths` is provided, ancestor crumb links are resolved through it
 * so that folders without an index page link to their first child page instead
 * of producing a 404.
 */
export function buildBreadcrumbs(
  contentSlug: string,
  title: string,
  basePath: string,
  folderPaths?: Map<string, string>,
): Array<{ label: string; path: string }> {
  if (contentSlug === '/') return []

  const segments = contentSlug.split('/')
  const crumbs: Array<{ label: string; path: string }> = []

  for (let i = 0; i < segments.length - 1; i++) {
    const slug = segments.slice(0, i + 1).join('/')
    crumbs.push({
      label: toTitleCase(segments[i]),
      path: folderPaths?.get(slug) ?? `${basePath}/${slug}`,
    })
  }

  // Current page (no link)
  crumbs.push({ label: title, path: '' })
  return crumbs
}

export async function loadDocsPages(
  config: ResolvedDocsConfig,
  sectionMetas?: Map<string, DocsSectionMeta>,
): Promise<DocsPage[]> {
  const homeConfig = config.homeConfigFile
    ? readJson5File<Record<string, unknown>>(config.homeConfigFile)
    : undefined

  const files = collectMarkdownFiles(config.contentDir)
  const concurrency = Math.max(1, availableParallelism() * 2)
  const lastUpdatedByFile = config.lastUpdated
    ? getGitLastUpdatedMap(config.rootDir, config.contentDir)
    : undefined

  // Build a single shared config — same object reference enables the processor
  // WeakMap cache so the expensive markdown processor and Shiki setup run only once.
  const sharedMarkdownConfig: MarkdownConfig = {
    ...(config.markdown ?? {}),
    shiki: {
      themes: config.markdown?.shiki?.themes ?? {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultShowLineNumbers: config.markdown?.shiki?.defaultShowLineNumbers,
      langAlias: config.markdown?.shiki?.langAlias,
    },
    rehypePlugins: [rehypeLinkTransform, rehypeAssetTransform],
  }

  // Process markdown files with bounded concurrency to manage memory at scale
  const results = await mapWithConcurrency(files, concurrency, async (filePath) => {
    let raw: string
    try {
      raw = readFileSync(filePath, 'utf-8')
    } catch (error) {
      throw wrapMarkdownFileError(filePath, config.rootDir, 'Failed to read markdown file', error)
    }

    // Extract frontmatter early to skip expensive markdown processing for drafts
    let extracted: ReturnType<typeof extractFrontmatter>
    try {
      extracted = extractFrontmatter(raw)
    } catch (error) {
      throw wrapMarkdownFileError(filePath, config.rootDir, 'Failed to parse frontmatter', error)
    }

    let earlyFrontmatter: DocsFrontmatter
    try {
      earlyFrontmatter = DocsFrontmatterSchema.parse(extracted.frontmatter ?? {})
    } catch (error) {
      throw wrapMarkdownFileError(filePath, config.rootDir, 'Invalid frontmatter', error)
    }
    const contentSlug = toContentSlug(filePath, config.contentDir)
    const isHome = contentSlug === '/'

    const frontmatter =
      isHome && homeConfig ? { ...homeConfig, ...earlyFrontmatter } : earlyFrontmatter
    if (frontmatter.draft) return null

    let result: Awaited<ReturnType<typeof processMarkdown>>
    try {
      result = await runWithDocsTransformContext(
        {
          basePath: config.basePath,
          contentDir: config.contentDir,
          filePath,
        },
        () =>
          processMarkdown(raw, sharedMarkdownConfig, {
            content: extracted.content,
            frontmatter: extracted.frontmatter,
            fileData: {
              pagesmithFilePath: filePath,
              pagesmithAssetRoot: config.contentDir,
            },
          }),
      )
    } catch (error) {
      throw wrapMarkdownFileError(filePath, config.rootDir, 'Failed to render markdown', error)
    }
    const html = prefixBasePathLinks(result.html, config.basePath)

    const routePath = isHome ? '/' : `/${contentSlug}`
    const section = resolvePageSection(filePath, config.contentDir, isHome)
    const title =
      frontmatter.title ??
      (isHome ? config.title : toTitleCase(contentSlug.split('/').at(-1) ?? section ?? 'Home'))

    // Resolve layout name: page frontmatter wins, then section meta defaults.
    const sectionMeta = section ? sectionMetas?.get(section) : undefined
    const isLanding = section != null && contentSlug === section
    const fmLayout =
      typeof frontmatter.layout === 'string' && frontmatter.layout ? frontmatter.layout : undefined
    let layoutName: string
    if (isHome) {
      layoutName = fmLayout ?? 'home'
    } else if (fmLayout) {
      layoutName = fmLayout
    } else if (isLanding && sectionMeta?.layout) {
      layoutName = sectionMeta.layout
    } else if (!isLanding && sectionMeta?.itemLayout) {
      layoutName = sectionMeta.itemLayout
    } else {
      layoutName = 'page'
    }

    // Git last-updated timestamp (only when enabled)
    const lastUpdated = config.lastUpdated ? lastUpdatedByFile?.get(filePath) : undefined

    return {
      title,
      routePath,
      contentSlug,
      section,
      frontmatter,
      html,
      headings: result.headings,
      sourcePath: filePath,
      isHome,
      layoutName,
      lastUpdated,
    } as DocsPage
  })

  const pages: DocsPage[] = []
  for (const result of results) {
    if (result != null) pages.push(result)
  }
  return pages.sort((left, right) => left.routePath.localeCompare(right.routePath))
}

export function collectContentAssets(contentDir: string) {
  return collectAssets([contentDir])
}
