import {
  type MarkdownEntry,
  type NavEntry,
  type NavGroup,
  normalizeRoute,
  leafSlug,
  routeFor,
  getTime,
  toIso,
  formatDate,
  estimateReadTime,
  escapeHtml,
  buildNavEntries,
  groupByField,
} from '@pagesmith/core/ssg-utils'
import featuresCollection from 'virtual:content/features'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'

type Frontmatter = {
  title: string
  description?: string
  date?: string | Date
  tags?: string[]
  series?: string
  seriesOrder?: number
}

type Entry = MarkdownEntry<Frontmatter>

export type { MarkdownEntry, NavEntry, Entry }
export type Heading = { depth: number; slug: string; text: string }
export type GuideGroup = NavGroup

export {
  normalizeRoute,
  leafSlug,
  routeFor,
  getTime,
  toIso,
  formatDate,
  estimateReadTime,
  escapeHtml,
  buildNavEntries,
}

export const guideEntries = [...(guideCollection as Entry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

export const featuresEntries = [...(featuresCollection as Entry[])].sort(
  (left, right) => getTime(right.frontmatter.date) - getTime(left.frontmatter.date),
)

export const pageEntries = [...(pagesCollection as Entry[])]

export function groupBySeries(base: string): GuideGroup[] {
  return groupByField(guideEntries, base, 'guide', 'series')
}
