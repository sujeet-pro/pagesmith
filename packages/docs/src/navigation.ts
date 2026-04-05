import { basename } from 'path'
import { toTitleCase, type ResolvedDocsConfig } from './config.js'
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
    for (const slug of series.articles) {
      if (!pageBySlug.has(slug)) {
        console.warn(
          `\x1b[33m⚠ [${sectionSlug}]\x1b[0m Series "${series.displayName}" references article slug "${slug}" which does not match any loaded page.`,
        )
      }
    }

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

export function getSitePayload(config: ResolvedDocsConfig, model: SiteModel) {
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
    socialImage: config.socialImage
      ? config.socialImage.startsWith('http')
        ? config.socialImage
        : `${config.basePath}/${config.socialImage.replace(/^\//, '')}`
      : undefined,
    icon: config.icon,
    favicon: config.favicon !== false ? `${config.basePath}/${basename(config.favicon)}` : false,
    faviconFallback: config.faviconFallback
      ? `${config.basePath}/${basename(config.faviconFallback)}`
      : false,
    appleTouchIcon: config.appleTouchIcon ? `${config.basePath}/apple-touch-icon.png` : false,
  }
}
