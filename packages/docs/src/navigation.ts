import { basename } from 'path'
import {
  toTitleCase,
  type FooterLink,
  type FooterLinkGroup,
  type FooterLinks,
  type ResolvedDocsConfig,
} from './config.js'
import type {
  DocsPage,
  DocsSectionMeta,
  DocsRootMeta,
  NavItem,
  PrevNextLink,
  SidebarItem,
  SidebarSection,
  SiteModel,
} from './content.js'

type SectionPageLookup = {
  byContentSlug: Map<string, DocsPage>
  byRelativeSlug: Map<string, DocsPage>
  byLeafSlug: Map<string, DocsPage | null>
}

function getOrder(page: DocsPage): number {
  return typeof page.frontmatter.order === 'number'
    ? page.frontmatter.order
    : Number.MAX_SAFE_INTEGER
}

function comparePages(left: DocsPage, right: DocsPage): number {
  const orderDelta = getOrder(left) - getOrder(right)
  if (orderDelta !== 0) return orderDelta
  return left.routePath.localeCompare(right.routePath)
}

function sortPages(pages: DocsPage[]): DocsPage[] {
  return [...pages].sort(comparePages)
}

function getSectionRelativeSlug(page: DocsPage, sectionSlug: string): string {
  if (page.contentSlug === sectionSlug) return sectionSlug
  return page.contentSlug.startsWith(`${sectionSlug}/`)
    ? page.contentSlug.slice(sectionSlug.length + 1)
    : page.contentSlug
}

function getLeafSlug(page: DocsPage): string {
  return page.contentSlug.split('/').at(-1) ?? page.contentSlug
}

function buildSectionPageLookup(sectionSlug: string, sectionPages: DocsPage[]): SectionPageLookup {
  const byContentSlug = new Map<string, DocsPage>()
  const byRelativeSlug = new Map<string, DocsPage>()
  const byLeafSlug = new Map<string, DocsPage | null>()

  for (const page of sectionPages) {
    byContentSlug.set(page.contentSlug, page)
    byRelativeSlug.set(getSectionRelativeSlug(page, sectionSlug), page)

    const leafSlug = getLeafSlug(page)
    if (!byLeafSlug.has(leafSlug)) {
      byLeafSlug.set(leafSlug, page)
    } else {
      byLeafSlug.set(leafSlug, null)
    }
  }

  return { byContentSlug, byRelativeSlug, byLeafSlug }
}

function findSectionPageBySlug(
  lookup: SectionPageLookup,
  rawSlug: string,
): { page?: DocsPage; ambiguous?: boolean } {
  const slug = rawSlug.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!slug) return {}

  const direct = lookup.byRelativeSlug.get(slug) ?? lookup.byContentSlug.get(slug)
  if (direct) return { page: direct }

  const byLeaf = lookup.byLeafSlug.get(slug)
  if (byLeaf === null) return { ambiguous: true }
  if (byLeaf) return { page: byLeaf }

  return {}
}

function toSidebarItem(page: DocsPage, basePath: string): SidebarItem {
  return {
    title: page.frontmatter.sidebarLabel ?? page.title,
    path: `${basePath}${page.routePath}`,
  }
}

function sortSectionPages(pages: DocsPage[], meta?: DocsSectionMeta): DocsPage[] {
  if (!meta?.orderBy) return sortPages(pages)

  if (meta.orderBy === 'publishedDate') {
    const getPublishedTime = (value: unknown): number => {
      if (!value) return 0
      if (value instanceof Date) {
        const t = value.getTime()
        return Number.isNaN(t) ? 0 : t
      }
      if (typeof value === 'string' || typeof value === 'number') {
        const t = new Date(value).getTime()
        return Number.isNaN(t) ? 0 : t
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
    const getPosition = (page: DocsPage): number | undefined => {
      const candidates = [
        page.contentSlug,
        page.section ? getSectionRelativeSlug(page, page.section) : undefined,
        getLeafSlug(page),
      ]

      for (const candidate of candidates) {
        if (!candidate) continue
        const position = order.get(candidate)
        if (position != null) return position
      }

      return undefined
    }

    return [...pages].sort((a, b) => {
      const posA = getPosition(a)
      const posB = getPosition(b)

      if (posA != null && posB != null) return posA - posB
      if (posA != null) return -1
      if (posB != null) return 1

      return comparePages(a, b)
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
  const lookup = buildSectionPageLookup(sectionSlug, sectionPages)
  const includedPages = new Set<DocsPage>()

  for (const series of meta.series!) {
    const items: SidebarItem[] = []

    for (const slug of series.articles) {
      const { page, ambiguous } = findSectionPageBySlug(lookup, slug)
      if (ambiguous) {
        console.warn(
          `\x1b[33m⚠ [${sectionSlug}]\x1b[0m Series "${series.displayName}" references article slug "${slug}" which matches multiple loaded pages. Use the full section-relative slug to disambiguate.`,
        )
        continue
      }

      if (!page) {
        console.warn(
          `\x1b[33m⚠ [${sectionSlug}]\x1b[0m Series "${series.displayName}" references article slug "${slug}" which does not match any loaded page.`,
        )
        continue
      }

      if (includedPages.has(page)) continue
      includedPages.add(page)
      items.push(toSidebarItem(page, basePath))
    }

    if (items.length > 0) {
      sections.push({
        title: series.displayName,
        slug: series.slug,
        collapsed: meta.collapsed,
        items,
      })
    }
  }

  const miscItems = sortSectionPages(
    sectionPages.filter((page) => !includedPages.has(page)),
    meta,
  ).map((page) => toSidebarItem(page, basePath))

  if (miscItems.length > 0) {
    sections.push({
      title: 'Miscellaneous',
      slug: `${sectionSlug}-misc`,
      collapsed: meta.collapsed,
      items: miscItems,
    })
  }

  return sections
}

function buildSidebarItems(
  sectionPages: DocsPage[],
  basePath: string,
  sectionMeta?: DocsSectionMeta,
): SidebarItem[] {
  return sortSectionPages(sectionPages, sectionMeta).map((page) => toSidebarItem(page, basePath))
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
  const lookup = buildSectionPageLookup(sectionSlug, nonLanding)

  // When series exist, the first referenced article of the first series wins.
  if (meta?.series && meta.series.length > 0) {
    for (const series of meta.series) {
      for (const slug of series.articles) {
        const { page } = findSectionPageBySlug(lookup, slug)
        if (page) return page
      }
    }
  }

  // For manual ordering with items array
  if (meta?.orderBy === 'manual' && meta.items && meta.items.length > 0) {
    for (const slug of meta.items) {
      const { page } = findSectionPageBySlug(lookup, slug)
      if (page) return page
    }
  }

  // Default: use sortSectionPages
  return sortSectionPages(nonLanding, meta)[0]
}

export function buildSiteModel(
  config: ResolvedDocsConfig,
  pages: DocsPage[],
  rootMeta?: DocsRootMeta,
  sectionMetas?: Map<string, DocsSectionMeta>,
): SiteModel {
  const pageByPath = new Map(pages.map((page) => [page.routePath, page]))
  const sidebarBySection = new Map<string, SidebarSection[]>()
  const navItems: NavItem[] = []
  const pagesBySection = new Map<string, DocsPage[]>()
  const folderPaths = new Map<string, string>()

  for (const page of pages) {
    if (!page.section) continue
    if (page.frontmatter.draft) continue
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
          items: buildSidebarItems(sectionPages, config.basePath, sectionMeta),
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

  // Build folderPaths: map every ancestor folder slug to a resolved URL.
  // Folders with an index page point to that page; folders without one
  // point to their first child page so breadcrumbs never produce 404s.
  const pageBySlug = new Map(pages.map((p) => [p.contentSlug, p]))
  const folderSlugs = new Set<string>()
  for (const page of pages) {
    if (page.isHome) continue
    const segments = page.contentSlug.split('/')
    for (let i = 1; i < segments.length; i++) {
      folderSlugs.add(segments.slice(0, i).join('/'))
    }
  }
  for (const folder of folderSlugs) {
    const indexPage = pageBySlug.get(folder)
    if (indexPage) {
      folderPaths.set(folder, `${config.basePath}${indexPage.routePath}`)
      continue
    }
    const children = sortPages(
      pages.filter(
        (p) => !p.isHome && p.contentSlug.startsWith(folder + '/') && p.contentSlug !== folder,
      ),
    )
    if (children.length > 0) {
      folderPaths.set(folder, `${config.basePath}${children[0].routePath}`)
    }
  }

  return {
    navItems,
    sidebarBySection,
    pageByPath,
    folderPaths,
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

export function getPrevNext(
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

function isFooterLinkGroup(link: FooterLink | FooterLinkGroup): link is FooterLinkGroup {
  return 'links' in link
}

function isGroupedFooterLinks(footerLinks: FooterLinks): footerLinks is FooterLinkGroup[] {
  return footerLinks.length > 0 && isFooterLinkGroup(footerLinks[0]!)
}

function prefixFooterLinkPath(path: string, basePath: string): string {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith(basePath)
    ? `${basePath}${path}`
    : path
}

function withResolvedFooterLinks(
  footerLinks: FooterLinks,
  basePath: string,
  needsBasePrefix: boolean,
): FooterLinks {
  if (!needsBasePrefix || !basePath || footerLinks.length === 0) {
    return footerLinks
  }

  if (isGroupedFooterLinks(footerLinks)) {
    return footerLinks.map((group) => ({
      ...group,
      links: group.links.map((link) => ({
        ...link,
        path: prefixFooterLinkPath(link.path, basePath),
      })),
    }))
  }

  return footerLinks.map((link) => ({
    ...link,
    path: prefixFooterLinkPath(link.path, basePath),
  }))
}

export function getSitePayload(config: ResolvedDocsConfig, model: SiteModel) {
  const base = config.basePath

  // Root meta wins, explicit config is next, otherwise reuse the primary nav
  // so the footer always exposes the site's major destinations by default.
  const footerLinkSource =
    model.rootMeta?.footerLinks !== undefined
      ? { links: model.rootMeta.footerLinks, needsBasePrefix: true }
      : config._userConfig?.footerLinks !== undefined || config.footerLinks.length > 0
        ? { links: config.footerLinks, needsBasePrefix: true }
        : { links: model.navItems, needsBasePrefix: false }

  const footerLinks = withResolvedFooterLinks(
    footerLinkSource.links,
    base,
    footerLinkSource.needsBasePrefix,
  )
  const withBasePath = (value: string): string => {
    const cleaned = value.replace(/^\//, '')
    return base ? `${base}/${cleaned}` : `/${cleaned}`
  }

  return {
    origin: config.origin,
    basePath: config.basePath,
    homeLink: config.homeLink,
    maintainer: config.maintainer,
    copyright: config.copyright,
    name: config.name,
    title: config.title,
    description: config.description,
    language: config.language,
    navItems: model.navItems,
    footerLinks,
    footerText: config.footerText,
    search: config.search,
    sidebar: config.sidebar,
    analytics: config.analytics,
    theme: config.theme,
    socialImage: config.socialImage
      ? config.socialImage.startsWith('http')
        ? config.socialImage
        : withBasePath(config.socialImage)
      : undefined,
    icon: config.icon,
    favicon: config.favicon !== false ? withBasePath(basename(config.favicon)) : false,
    faviconFallback: config.faviconFallback
      ? withBasePath(basename(config.faviconFallback))
      : false,
    appleTouchIcon: config.appleTouchIcon ? withBasePath('apple-touch-icon.png') : false,
  }
}
