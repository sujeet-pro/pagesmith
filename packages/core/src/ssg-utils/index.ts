/**
 * Shared SSG utilities for framework example sites.
 *
 * Provides types that match virtual module output, icon SVGs,
 * route helpers, date formatting, and HTML document rendering
 * used across all framework examples.
 */

// ── Types ──

export type Heading = {
  depth: number
  slug: string
  text: string
}

export type MarkdownEntry<T extends Record<string, unknown> = Record<string, unknown>> = {
  contentSlug: string
  html: string
  headings: Heading[]
  frontmatter: T
}

export type NavEntry = {
  slug: string
  title: string
  description?: string
  url: string
  date?: string
  tags?: string[]
}

export type NavGroup = {
  series: string
  items: NavEntry[]
}

// ── Icons ──

export const menuIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
export const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'
export const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

// ── Route helpers ──

export function normalizeRoute(url: string, base: string): string {
  if (!base || !url.startsWith(base)) return url === '' ? '/' : url
  const trimmed = url.slice(base.length)
  if (trimmed === '') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function leafSlug(contentSlug: string, collection: string): string {
  return contentSlug.replace(new RegExp(`^${collection}/`), '')
}

export function routeFor(
  entry: MarkdownEntry,
  collection: string,
  options?: { topLevel?: string[] },
): string {
  const slug = leafSlug(entry.contentSlug, collection)
  const topLevel = options?.topLevel ?? ['pages']
  return topLevel.includes(collection) ? `/${slug}` : `/${collection}/${slug}`
}

// ── Date helpers ──

export function getTime(date: string | Date | undefined): number {
  if (!date) return 0
  return date instanceof Date ? date.getTime() : new Date(date).getTime()
}

export function toIso(date: string | Date | undefined): string | undefined {
  if (!date) return undefined
  return (date instanceof Date ? date : new Date(date)).toISOString()
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Content helpers ──

export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildNavEntries(
  entries: MarkdownEntry[],
  base: string,
  section: string,
): NavEntry[] {
  return entries.map((entry) => ({
    slug: leafSlug(entry.contentSlug, section),
    title: (entry.frontmatter.title as string) ?? '',
    description: entry.frontmatter.description as string | undefined,
    url: `${base}/${section}/${leafSlug(entry.contentSlug, section)}`,
    date: toIso(entry.frontmatter.date as string | Date | undefined),
    tags: (entry.frontmatter.tags as string[]) ?? [],
  }))
}

export function groupByField(
  entries: MarkdownEntry[],
  base: string,
  section: string,
  field: string,
  fallback = 'Other',
): NavGroup[] {
  const groups: NavGroup[] = []
  const seen = new Map<string, NavEntry[]>()

  for (const entry of entries) {
    const series = (entry.frontmatter[field] as string) ?? fallback
    if (!seen.has(series)) {
      const items: NavEntry[] = []
      seen.set(series, items)
      groups.push({ series, items })
    }
    seen.get(series)!.push({
      slug: leafSlug(entry.contentSlug, section),
      title: (entry.frontmatter.title as string) ?? '',
      url: `${base}/${section}/${leafSlug(entry.contentSlug, section)}`,
    })
  }

  return groups
}

// ── HTML document shell ──

export type DocumentShellOptions = {
  title: string
  description?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
  sidebarHtml?: string
  headHtml?: string
}

export function renderDocumentShell(options: DocumentShellOptions): string {
  const {
    title,
    description,
    basePath,
    cssPath,
    jsPath,
    searchEnabled,
    bodyHtml,
    sidebarHtml,
    headHtml,
  } = options
  const base = basePath.replace(/\/+$/, '')

  return `<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    ${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ''}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    ${description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : ''}
    <link rel="icon" href="${base}/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${base}/assets/fonts.css" />
    <link rel="stylesheet" href="${cssPath}" />
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
    ${searchEnabled ? '<noscript><style>.doc-search-trigger{display:none!important}</style></noscript>' : ''}
    ${headHtml ?? ''}
  </head>
  <body>
    ${bodyHtml}
    ${
      sidebarHtml
        ? `<dialog class="doc-sidebar-modal" id="sidebar-modal">
            <div class="doc-sidebar-modal-backdrop" data-sidebar-close=""></div>
            <div class="doc-sidebar-modal-panel">
              <button type="button" class="doc-sidebar-modal-close" data-sidebar-close="" aria-label="Close navigation">${closeIcon}</button>
              <nav class="doc-sidebar-nav" aria-label="Sidebar navigation">${sidebarHtml}</nav>
            </div>
          </dialog>`
        : ''
    }
    ${
      searchEnabled
        ? `<dialog class="doc-search-modal" id="search-modal" aria-label="Search" data-search-show-images="false" data-search-show-sub-results="true">
            <div class="doc-search-modal-inner">
              <div class="doc-search-modal-header">
                <span class="doc-search-modal-title">Search</span>
                <button type="button" class="doc-search-modal-close" aria-label="Close" data-search-close="">${closeIcon}</button>
              </div>
              <div class="doc-search-modal-body" id="search-container" data-pagefind-search=""></div>
            </div>
          </dialog>`
        : ''
    }
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}
