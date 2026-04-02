import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'

export type Heading = {
  depth: number
  slug: string
  text: string
}

export type MarkdownEntry = {
  contentSlug: string
  html: string
  headings: Heading[]
  frontmatter: {
    title: string
    description?: string
    date?: string | Date
    tags?: string[]
    series?: string
    seriesOrder?: number
  }
}

export type NavEntry = {
  slug: string
  title: string
  description?: string
  url: string
  date?: string
  tags?: string[]
}

export type GuideGroup = {
  series: string
  items: NavEntry[]
}

export const guideEntries = [...(guideCollection as MarkdownEntry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

export const blogEntries = [...(blogCollection as MarkdownEntry[])].sort(
  (left, right) => getTime(right.frontmatter.date) - getTime(left.frontmatter.date),
)

export const pageEntries = [...(pagesCollection as MarkdownEntry[])]

export function normalizeRoute(url: string, base: string): string {
  if (!base || !url.startsWith(base)) return url === '' ? '/' : url
  const trimmed = url.slice(base.length)
  if (trimmed === '') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function leafSlug(contentSlug: string, collection: string): string {
  return contentSlug.replace(new RegExp(`^${collection}/`), '')
}

export function routeFor(entry: MarkdownEntry, collection: 'guide' | 'blog' | 'pages'): string {
  const slug = leafSlug(entry.contentSlug, collection)
  return collection === 'pages' ? `/${slug}` : `/${collection}/${slug}`
}

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
  section: 'guide' | 'blog',
): NavEntry[] {
  return entries.map((entry) => ({
    slug: leafSlug(entry.contentSlug, section),
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    url: `${base}/${section}/${leafSlug(entry.contentSlug, section)}`,
    date: toIso(entry.frontmatter.date),
    tags: entry.frontmatter.tags ?? [],
  }))
}

export function groupBySeries(base: string): GuideGroup[] {
  const groups: GuideGroup[] = []
  const seen = new Map<string, NavEntry[]>()

  for (const entry of guideEntries) {
    const series = entry.frontmatter.series ?? 'Other'
    if (!seen.has(series)) {
      const items: NavEntry[] = []
      seen.set(series, items)
      groups.push({ series, items })
    }
    seen.get(series)!.push({
      slug: leafSlug(entry.contentSlug, 'guide'),
      title: entry.frontmatter.title,
      url: `${base}/guide/${leafSlug(entry.contentSlug, 'guide')}`,
    })
  }

  return groups
}
