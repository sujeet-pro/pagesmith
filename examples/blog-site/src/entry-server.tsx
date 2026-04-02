import { existsSync, readdirSync, readFileSync } from 'fs'
import { extname, join, relative, resolve } from 'path'
import JSON5 from 'json5'
import { processMarkdown } from '@pagesmith/core/markdown'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import Article from '../layouts/Article'
import Blog from '../layouts/Blog'
import Home from '../layouts/Home'
import Listing from '../layouts/Listing'
import NotFound from '../layouts/NotFound'
import Page from '../layouts/Page'
import Project from '../layouts/Project'
import TagIndex from '../layouts/TagIndex'
import TagListing from '../layouts/TagListing'
import type { PageMeta, SiteConfig, TagPageData } from '../layouts/types'
import { withBase } from '../layouts/utils'

function getContentDir(root?: string): string {
  if (root) return resolve(root, 'content')
  return resolve(import.meta.dirname, '../content')
}

const layouts = {
  Article,
  Blog,
  Home,
  Listing,
  NotFound,
  Page,
  Project,
  TagIndex,
  TagListing,
}

type LayoutName = keyof typeof layouts

type LoadedPage = {
  filePath: string
  slug: string
  routePath: string
  section?: string
  isHome: boolean
  isSectionIndex: boolean
  frontmatter: Record<string, any>
  html: string
  headings: any[]
  meta: PageMeta[]
}

type SiteConfigWithPageTypes = SiteConfig & {
  pageTypesConfig: Record<string, any>
}

type PageTypeData = {
  type: string
  displayName: string
  series: Array<{
    slug: string
    displayName: string
    shortName: string
    description?: string
    articles: Array<{
      slug: string
      title: string
      description: string
      url: string
      tags: string[]
    }>
  }>
  unsorted: Array<{
    slug: string
    title: string
    description: string
    url: string
    tags: string[]
  }>
}

type SeriesNav = {
  series: {
    slug: string
    displayName: string
    shortName: string
    description?: string
    articles: string[]
  }
  articles: Array<{ slug: string; title: string; url: string }>
  prev?: { slug: string; title: string; url: string }
  next?: { slug: string; title: string; url: string }
}

function readJson5<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON5.parse(readFileSync(filePath, 'utf-8')) as T
}

function toTitleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function toContentSlug(filePath: string, contentDir: string): string {
  let slug = relative(contentDir, filePath).replace(/\\/g, '/')
  const extension = extname(slug)
  if (extension) slug = slug.slice(0, -extension.length)
  if (slug === 'README' || slug === 'index') return '/'
  if (slug.endsWith('/README')) slug = slug.slice(0, -7)
  if (slug.endsWith('/index')) slug = slug.slice(0, -6)
  return slug
}

function prefixInternalLinks(html: string, base: string): string {
  return html.replace(/(href|src)="(\/[^"]*)"/g, (_, attr, value) => {
    return `${attr}="${withBase(base, value)}"`
  })
}

function collectMarkdown(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdown(fullPath))
      continue
    }
    if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files.sort((left, right) => left.localeCompare(right))
}

async function loadPages(base: string, contentDir: string): Promise<LoadedPage[]> {
  const loadedPages: LoadedPage[] = []

  for (const filePath of collectMarkdown(contentDir)) {
    const raw = readFileSync(filePath, 'utf-8')
    const result = await processMarkdown(raw)
    const slug = toContentSlug(filePath, contentDir)
    const routePath = slug === '/' ? '/' : `/${slug}`
    const section = slug !== '/' ? slug.split('/')[0] : undefined
    const isHome = slug === '/'
    const isSectionIndex = Boolean(section && slug === section)
    const readTime = Math.max(1, Math.ceil(raw.split(/\s+/).length / 200))

    loadedPages.push({
      filePath,
      slug,
      routePath,
      section,
      isHome,
      isSectionIndex,
      frontmatter: {
        ...result.frontmatter,
        readTime,
      },
      html: prefixInternalLinks(result.html, base),
      headings: result.headings,
      meta: [],
    })
  }

  const meta = loadedPages.map((page) => ({
    slug: page.slug,
    filePath: page.filePath,
    frontmatter: page.frontmatter,
  }))

  for (const page of loadedPages) {
    page.meta = meta
  }

  return loadedPages
}

function loadSectionMeta(contentDir: string) {
  return new Map(
    ['articles', 'blogs', 'projects'].map((section) => [
      section,
      readJson5<Record<string, any>>(resolve(contentDir, section, 'meta.json5')) ?? {},
    ]),
  )
}

function normalizeSocialLink(value: any) {
  if (!value) return { handle: '', url: '#' }
  if (typeof value === 'string') {
    const handle = value.split('/').filter(Boolean).pop() ?? ''
    return { handle, url: value }
  }
  return value
}

function normalizeCopyright(value: unknown) {
  if (value && typeof value === 'object') return value as { holder: string; startYear: number }
  if (typeof value === 'string') {
    const match = value.match(/(?:©\s*)?(\d{4})(?:[–-]\d{4})?\s+(.+)/u)
    if (match) {
      return {
        startYear: parseInt(match[1], 10),
        holder: match[2]!,
      }
    }
    return {
      startYear: new Date().getFullYear(),
      holder: value.replace(/^©\s*/u, ''),
    }
  }
  return {
    startYear: new Date().getFullYear(),
    holder: 'Pagesmith',
  }
}

function normalizeSiteConfig(
  rawSite: Record<string, any>,
  config: SsgRenderConfig,
): SiteConfigWithPageTypes {
  const navItems = (rawSite.navItems ?? []).map((item: Record<string, string>) => ({
    label: item.label,
    path: withBase(config.base, item.path ?? item.href ?? '/'),
  }))

  return {
    origin: rawSite.origin ?? 'https://example.com',
    name: rawSite.name ?? 'Pagesmith Blog',
    title: rawSite.title ?? rawSite.name ?? 'Pagesmith Blog',
    description: rawSite.description ?? 'Custom Pagesmith blog example.',
    language: rawSite.language ?? 'en',
    baseUrl: config.base,
    defaultLayout: 'Page',
    styles: [config.cssPath],
    markdown: rawSite.markdown ?? {},
    navItems,
    footerLinks: rawSite.footerLinks
      ? rawSite.footerLinks.map((item: Record<string, string>) => ({
          label: item.label,
          path: withBase(config.base, item.path ?? item.href ?? '/'),
        }))
      : navItems,
    social: {
      github: normalizeSocialLink(rawSite.social?.github),
      linkedin: normalizeSocialLink(rawSite.social?.linkedin),
      twitter: normalizeSocialLink(rawSite.social?.twitter),
    },
    copyright: normalizeCopyright(rawSite.copyright),
    featuredArticles: rawSite.featured?.articles ?? [],
    featuredSeries: rawSite.featured?.series ?? [],
    pageTypes: Object.keys(rawSite.pageTypes ?? {}),
    home: rawSite.home,
    analytics: rawSite.analytics,
    seo: rawSite.seo,
    theme: rawSite.theme,
    assets: {
      cssPath: config.cssPath,
      jsPath: config.jsPath,
    },
    search: rawSite.search,
    pageTypesConfig: rawSite.pageTypes ?? {},
  }
}

function buildPageTypes(
  pages: LoadedPage[],
  sectionMetaMap: Map<string, Record<string, any>>,
  siteConfig: SiteConfigWithPageTypes,
) {
  const pageTypes = new Map<string, PageTypeData>()

  for (const [section, pageTypeConfig] of Object.entries(siteConfig.pageTypesConfig ?? {})) {
    const entries = pages.filter((page) => page.section === section && !page.isSectionIndex)
    const summaries = entries.map((page) => ({
      slug: page.slug,
      title: page.frontmatter.title ?? toTitleCase(page.slug.split('/').at(-1) ?? section),
      description: page.frontmatter.description ?? '',
      url: withBase(siteConfig, page.routePath),
      tags: page.frontmatter.tags ?? [],
    }))
    const summaryBySlug = new Map(
      summaries.map((summary) => [summary.slug.split('/').at(-1), summary]),
    )

    const seriesDefs = sectionMetaMap.get(section)?.series ?? {}
    const usedSlugs = new Set<string>()
    const series = Object.entries(seriesDefs).map(([seriesSlug, definition]) => {
      const articles = ((definition as { items?: string[] }).items ?? [])
        .map((itemSlug) => summaryBySlug.get(itemSlug))
        .filter((article): article is NonNullable<typeof article> => article != null)

      for (const article of articles) {
        usedSlugs.add(article.slug)
      }

      return {
        slug: seriesSlug,
        displayName: (definition as { title?: string }).title ?? toTitleCase(seriesSlug),
        shortName:
          (definition as { shortName?: string; title?: string }).shortName ??
          (definition as { title?: string }).title ??
          toTitleCase(seriesSlug),
        description: (definition as { description?: string }).description,
        articles,
      }
    })

    const unsorted = summaries.filter((summary) => !usedSlugs.has(summary.slug))
    pageTypes.set(section, {
      type: section,
      displayName: (pageTypeConfig as { displayName?: string }).displayName ?? toTitleCase(section),
      series,
      unsorted,
    })
  }

  return pageTypes
}

function getFeaturedArticles(articlePageType: PageTypeData | undefined, slugs: string[]) {
  if (!articlePageType) return []
  const allArticles = [
    ...articlePageType.series.flatMap((series) => series.articles),
    ...articlePageType.unsorted,
  ]
  const byLeafSlug = new Map(
    allArticles.map((article) => [article.slug.split('/').at(-1), article]),
  )
  return (slugs ?? []).map((slug) => byLeafSlug.get(slug)).filter(Boolean)
}

function getFeaturedSeries(pageTypes: Map<string, PageTypeData>, slugs: string[]) {
  const allSeries = [...pageTypes.values()].flatMap((pageType) => pageType.series)
  const bySlug = new Map(allSeries.map((series) => [series.slug, series]))
  return (slugs ?? []).map((slug) => bySlug.get(slug)).filter(Boolean)
}

function buildTagIndex(pages: LoadedPage[], siteConfig: SiteConfigWithPageTypes) {
  const allTags = new Map<string, TagPageData>()

  for (const page of pages.filter((entry) => entry.section && !entry.isSectionIndex)) {
    for (const tag of page.frontmatter.tags ?? []) {
      if (!allTags.has(tag)) {
        allTags.set(tag, {
          tag,
          entries: {},
        })
      }

      const group = allTags.get(tag)!
      if (!group.entries[page.section!]) {
        group.entries[page.section!] = []
      }

      group.entries[page.section!].push({
        slug: page.slug,
        title: page.frontmatter.title ?? toTitleCase(page.slug.split('/').at(-1) ?? page.section!),
        url: withBase(siteConfig, page.routePath),
        lastUpdatedOn: String(
          page.frontmatter.lastUpdatedOn ?? page.frontmatter.publishedDate ?? '',
        ),
      })
    }
  }

  return allTags
}

function resolveLayoutName(
  page: LoadedPage,
  sectionMetaMap: Map<string, Record<string, any>>,
  site: SiteConfigWithPageTypes,
): LayoutName {
  if (page.frontmatter.layout) return page.frontmatter.layout as LayoutName
  if (page.isHome) return 'Home'
  if (page.isSectionIndex && page.section) {
    return (site.pageTypesConfig?.[page.section]?.layout ?? 'Listing') as LayoutName
  }
  if (page.section) {
    return (site.pageTypesConfig?.[page.section]?.itemLayout ??
      sectionMetaMap.get(page.section)?.layout ??
      'Page') as LayoutName
  }
  return 'Page'
}

function getSeriesNavigation(
  page: LoadedPage,
  pageType: PageTypeData | undefined,
): SeriesNav | undefined {
  if (!pageType) return undefined

  for (const series of pageType.series) {
    const currentIndex = series.articles.findIndex((article) => article.slug === page.slug)
    if (currentIndex === -1) continue

    const articles = series.articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      url: article.url,
    }))

    return {
      series: {
        slug: series.slug,
        displayName: series.displayName,
        shortName: series.shortName,
        description: series.description,
        articles: series.articles.map((article) => article.slug),
      },
      articles,
      prev: currentIndex > 0 ? articles[currentIndex - 1] : undefined,
      next: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : undefined,
    }
  }

  return undefined
}

function renderLayout(layoutName: LayoutName, props: Record<string, any>): string {
  const layout = layouts[layoutName] as (input: Record<string, any>) => unknown
  return String(layout(props))
}

async function loadSite(config: SsgRenderConfig) {
  const contentDir = getContentDir(config.root)
  const site = normalizeSiteConfig(
    readJson5<Record<string, any>>(resolve(contentDir, 'site.json5')) ?? {},
    config,
  )
  const sectionMeta = loadSectionMeta(contentDir)
  const pages = await loadPages(config.base, contentDir)
  const pageTypes = buildPageTypes(pages, sectionMeta, site)
  const featuredArticles = getFeaturedArticles(pageTypes.get('articles'), site.featuredArticles)
  const featuredSeries = getFeaturedSeries(pageTypes, site.featuredSeries)
  const allTags = buildTagIndex(pages, site)

  return {
    site,
    sectionMeta,
    pages,
    pageTypes,
    featuredArticles,
    featuredSeries,
    allTags,
  }
}

export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { pages, allTags } = await loadSite(config)
  const routes = pages.map((page) => page.routePath)

  if (allTags.size > 0) {
    routes.push('/tags')
    for (const tag of allTags.keys()) {
      routes.push(`/tags/${tag}`)
    }
  }

  routes.push('/404')
  return Array.from(new Set(routes))
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const routePath = (() => {
    if (config.base && url.startsWith(config.base)) {
      const trimmed = url.slice(config.base.length)
      if (trimmed === '') return '/'
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    }
    return url
  })()
  const normalizedPath =
    routePath !== '/' && routePath.endsWith('/') ? routePath.slice(0, -1) : routePath

  const { site, sectionMeta, pages, pageTypes, featuredArticles, featuredSeries, allTags } =
    await loadSite(config)

  if (normalizedPath === '/404') {
    return renderLayout('NotFound', {
      content: '',
      frontmatter: {},
      headings: [],
      slug: '/404',
      site,
    })
  }

  if (normalizedPath === '/tags' && allTags.size > 0) {
    return renderLayout('TagIndex', {
      content: '',
      frontmatter: {
        title: 'Tags',
        description: 'Browse entries by topic.',
      },
      headings: [],
      slug: withBase(site, '/tags'),
      site,
      allTags,
      pages: pages[0]?.meta ?? [],
    })
  }

  const tagMatch = normalizedPath.match(/^\/tags\/(.+)$/)
  if (tagMatch && allTags.size > 0) {
    const tag = tagMatch[1]!
    return renderLayout('TagListing', {
      content: '',
      frontmatter: {
        title: `Tag: ${tag}`,
        description: `Entries tagged ${tag}.`,
      },
      headings: [],
      slug: withBase(site, `/tags/${tag}`),
      site,
      allTags,
      pages: pages[0]?.meta ?? [],
    })
  }

  const page = pages.find((candidate) => candidate.routePath === normalizedPath)
  if (!page) {
    return renderLayout('NotFound', {
      content: '',
      frontmatter: {},
      headings: [],
      slug: normalizedPath,
      site,
    })
  }

  const layoutName = resolveLayoutName(page, sectionMeta, site)
  const pageType = page.section ? pageTypes.get(page.section) : undefined
  const seriesNav = page.section ? getSeriesNavigation(page, pageType) : undefined

  return renderLayout(layoutName, {
    content: page.html,
    frontmatter: page.frontmatter,
    headings: page.headings,
    slug: withBase(site, page.routePath),
    site,
    pages: page.meta,
    pageType,
    allTags,
    seriesNav,
    featuredArticles: page.isHome ? featuredArticles : undefined,
    featuredSeries: page.isHome ? featuredSeries : undefined,
    stats: page.isHome
      ? {
          totalArticles:
            (pageTypes.get('articles')?.series.flatMap((series) => series.articles).length ?? 0) +
            (pageTypes.get('articles')?.unsorted.length ?? 0),
          totalSeries: pageTypes.get('articles')?.series.length ?? 0,
        }
      : undefined,
  })
}
