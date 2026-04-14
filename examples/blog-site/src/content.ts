import { resolve } from 'path'
import {
  createContentLayer,
  defineCollection,
  defineConfig,
  z,
  type ContentEntry,
} from '@pagesmith/site'

export type RenderedEntry = {
  slug: string
  collection: string
  data: Record<string, any>
  html: string
  headings: Array<{ depth: number; slug: string; text: string }>
  readTime: number
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

export function buildLayer(root?: string) {
  const contentRoot = root ? resolve(root) : resolve(import.meta.dirname, '..')

  return createContentLayer(
    defineConfig({
      root: contentRoot,
      collections: {
        guide: defineCollection({
          loader: 'markdown',
          directory: resolve(contentRoot, 'content/guide'),
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            date: z.coerce.date(),
            tags: z.array(z.string()).default([]),
            series: z.string().optional(),
            seriesOrder: z.number().optional(),
          }),
        }),
        pages: defineCollection({
          loader: 'markdown',
          directory: resolve(contentRoot, 'content/pages'),
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
          }),
        }),
      },
    }),
  )
}

export async function renderEntries(
  entries: ContentEntry<any>[],
  collection: string,
): Promise<RenderedEntry[]> {
  const rendered: RenderedEntry[] = []
  for (const entry of entries) {
    const result = await entry.render()
    rendered.push({
      slug: entry.slug,
      collection,
      data: entry.data,
      html: result.html,
      headings: result.headings,
      readTime: result.readTime,
    })
  }
  return rendered
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

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeRoute(url: string, base: string): string {
  if (!base || !url.startsWith(base)) return url === '' ? '/' : url
  const trimmed = url.slice(base.length)
  if (trimmed === '') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function routeFor(entry: RenderedEntry): string {
  if (entry.collection === 'pages') return `/${entry.slug}`
  return `/${entry.collection}/${entry.slug}`
}

export function buildNavEntries(entries: RenderedEntry[], base: string): NavEntry[] {
  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    url: `${base}/${entry.collection}/${entry.slug}`,
    date: toIso(entry.data.date),
    tags: entry.data.tags ?? [],
  }))
}

export function groupBySeries(guideEntries: RenderedEntry[], base: string): GuideGroup[] {
  const groups: GuideGroup[] = []
  const seen = new Map<string, NavEntry[]>()

  for (const entry of guideEntries) {
    const series = entry.data.series ?? 'Other'
    if (!seen.has(series)) {
      const items: NavEntry[] = []
      seen.set(series, items)
      groups.push({ series, items })
    }
    seen.get(series)!.push({
      slug: entry.slug,
      title: entry.data.title,
      url: `${base}/guide/${entry.slug}`,
    })
  }

  return groups
}
