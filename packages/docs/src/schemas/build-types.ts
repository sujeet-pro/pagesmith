import type { SiteConfig } from './config'
import type { Heading } from './heading'
import type { PageTypeMeta } from './meta'
import type { PageMeta, PageTypeData, TagPageData } from './page-data'

export type PageTask = {
  slug: string
  filePath: string
  contentType: string
  layoutName: string
}

export type GlobalIndex = {
  config: SiteConfig
  pageList: PageMeta[]
  pageTypeData: Map<string, PageTypeData>
  tagIndex: Map<string, TagPageData>
  pageTypeMetas: Map<string, PageTypeMeta>
}

export type ProcessedPage = {
  slug: string
  html: string
  headings: Heading[]
  frontmatter: Record<string, any>
  layoutName: string
}
