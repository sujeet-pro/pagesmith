/**
 * Layout prop types — inlined from @pagesmith/docs/schemas.
 *
 * These types define the data each layout receives at render time.
 * They are kept locally so the blog-site example depends only on @pagesmith/core.
 */

import type { Heading } from '@pagesmith/core/schemas'

// ── Site config (mirrors @pagesmith/docs/schemas/config SiteConfig) ──

export type NavItem = {
  path: string
  label: string
}

export type SocialLink = {
  handle: string
  url: string
}

export type HomeConfig = {
  pageTitle: string
  pageDescription: string
  profile: {
    name: string
    title: string
    bio: string
    imageAlt: string
  }
  profileActions: Record<string, string>
}

export type SiteConfig = {
  origin: string
  name: string
  title: string
  description: string
  language: string
  baseUrl: string
  defaultLayout: string
  styles: string[]
  markdown: Record<string, any>
  navItems: NavItem[]
  footerLinks: NavItem[]
  social: {
    twitter: SocialLink
    github: SocialLink
    linkedin: SocialLink
  }
  copyright: {
    holder: string
    startYear: number
  }
  featuredArticles: string[]
  featuredSeries: string[]
  pageTypes: string[]
  home: HomeConfig
  analytics?: {
    googleAnalytics?: string
  }
  seo?: {
    locale?: string
    twitterHandle?: string
    defaultOgType?: string
  }
  theme?: {
    lightColor: string
    darkColor: string
  }
}

// ── Article summary ──

export type ArticleSummary = {
  slug: string
  title: string
  description: string
  url: string
  tags: string[]
}

// ── Series data ──

export type SeriesData = {
  slug: string
  displayName: string
  shortName: string
  description?: string
  articles: ArticleSummary[]
}

// ── Page type data ──

export type PageTypeData = {
  type: string
  displayName: string
  series: SeriesData[]
  unsorted: ArticleSummary[]
}

// ── Series navigation (prev/next within a series) ──

export type SeriesNavArticle = {
  slug: string
  title: string
  url: string
}

export type SeriesDef = {
  slug: string
  displayName: string
  shortName: string
  description?: string
  articles: string[]
}

export type SeriesNav = {
  series: SeriesDef
  articles: SeriesNavArticle[]
  prev?: SeriesNavArticle
  next?: SeriesNavArticle
}

// ── Tag page data ──

export type TagPageEntry = {
  slug: string
  title: string
  url: string
  lastUpdatedOn: string
}

export type TagPageData = {
  tag: string
  entries: Record<string, TagPageEntry[]>
}

// ── Page meta ──

export type PageMeta = {
  slug: string
  filePath: string
  frontmatter: Record<string, any>
}

// ── Layout props ──

export type BaseLayoutProps = {
  content: string
  frontmatter: Record<string, any>
  headings: Heading[]
  slug: string
  site: SiteConfig
}

export type ArticleLayoutProps = BaseLayoutProps & {
  pages: PageMeta[]
  pageType?: PageTypeData
  allTags?: Map<string, TagPageData>
  seriesNav?: SeriesNav
}

export type BlogLayoutProps = BaseLayoutProps & {
  pages: PageMeta[]
  seriesNav?: SeriesNav
}

export type ProjectLayoutProps = BaseLayoutProps & {
  pages: PageMeta[]
  seriesNav?: SeriesNav
}

export type HomeLayoutProps = BaseLayoutProps & {
  featuredArticles?: ArticleSummary[]
  featuredSeries?: SeriesData[]
  stats?: {
    totalArticles: number
    totalSeries: number
  }
}

export type PageLayoutProps = BaseLayoutProps

export type ListingLayoutProps = BaseLayoutProps & {
  pageType?: PageTypeData
}

export type TagIndexLayoutProps = BaseLayoutProps & {
  allTags?: Map<string, TagPageData>
  pages?: PageMeta[]
}

export type TagListingLayoutProps = BaseLayoutProps & {
  allTags?: Map<string, TagPageData>
  pages?: PageMeta[]
}
