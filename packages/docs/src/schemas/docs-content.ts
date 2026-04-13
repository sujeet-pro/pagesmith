import { BaseFrontmatterSchema } from '@pagesmith/core/schemas'
import { z } from 'zod'
import { DocsFooterLinksSchema, DocsLinkSchema } from './docs-config.js'

export const DocsRootMetaSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  headerLinks: z.array(DocsLinkSchema).optional(),
  footerLinks: DocsFooterLinksSchema.optional(),
})

export type DocsRootMeta = z.infer<typeof DocsRootMetaSchema>

export const DocsSeriesSchema = z.object({
  slug: z.string(),
  displayName: z.string(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  articles: z.array(z.string()),
})

export type DocsSeries = z.infer<typeof DocsSeriesSchema>

export const DocsSectionMetaSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  layout: z.string().optional(),
  itemLayout: z.string().optional(),
  orderBy: z.enum(['manual', 'publishedDate']).optional(),
  collapsed: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  series: z.array(DocsSeriesSchema).optional(),
})

export type DocsSectionMeta = z.infer<typeof DocsSectionMetaSchema>

export const DocsActionSchema = z.object({
  text: z.string(),
  link: z.string(),
  theme: z.enum(['brand', 'alt']).optional(),
  icon: z.string().optional(),
})

export type DocsAction = z.infer<typeof DocsActionSchema>

export const DocsHeroSchema = z
  .object({
    name: z.string().optional(),
    text: z.string().optional(),
    tagline: z.string().optional(),
    badge: z.string().optional(),
    actions: z.array(DocsActionSchema).optional(),
  })
  .passthrough()

export type DocsHero = z.infer<typeof DocsHeroSchema>

export const DocsFeatureSchema = z
  .object({
    title: z.string(),
    details: z.string(),
    icon: z.string().optional(),
  })
  .passthrough()

export type DocsFeature = z.infer<typeof DocsFeatureSchema>

export const DocsPackageCardSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    href: z.string().optional(),
    tag: z.string().optional(),
    version: z.string().optional(),
  })
  .passthrough()

export type DocsPackageCard = z.infer<typeof DocsPackageCardSchema>

export const DocsCodeExampleSchema = z.object({
  label: z.string().optional(),
  title: z.string().optional(),
  code: z.string(),
})

export type DocsCodeExample = z.infer<typeof DocsCodeExampleSchema>

/** Optional shell chrome toggles for built-in docs layouts (all default to true when omitted). */
export const DocsChromeSchema = z
  .object({
    header: z.boolean().optional(),
    sidebar: z.boolean().optional(),
    toc: z.boolean().optional(),
    footer: z.boolean().optional(),
  })
  .passthrough()

export type DocsChrome = z.infer<typeof DocsChromeSchema>

const DocsDateInputSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string(),
)

const DocsBaseFrontmatterSchema = BaseFrontmatterSchema.partial().extend({
  publishedDate: DocsDateInputSchema.optional(),
  lastUpdatedOn: DocsDateInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
})

const DocsPageFrontmatterShape = {
  ...DocsBaseFrontmatterSchema.shape,
  layout: z.string().optional(),
  chrome: DocsChromeSchema.optional(),
  navLabel: z.string().optional(),
  sidebarLabel: z.string().optional(),
  order: z.number().optional(),
  socialImage: z.string().optional(),
}

const DocsHomeFrontmatterShape = {
  tagline: z.string().optional(),
  badge: z.string().optional(),
  actions: z.array(DocsActionSchema).optional(),
  hero: DocsHeroSchema.optional(),
  features: z.array(DocsFeatureSchema).optional(),
  install: z.string().optional(),
  packages: z.array(DocsPackageCardSchema).optional(),
  codeExample: DocsCodeExampleSchema.optional(),
}

export const DocsPageFrontmatterSchema = z.object(DocsPageFrontmatterShape).passthrough()

export type DocsPageFrontmatter = z.infer<typeof DocsPageFrontmatterSchema>

export const DocsHomeFrontmatterSchema = z
  .object({
    ...DocsPageFrontmatterShape,
    ...DocsHomeFrontmatterShape,
  })
  .passthrough()

export type DocsHomeFrontmatter = z.infer<typeof DocsHomeFrontmatterSchema>

// The runtime accepts the full home-page-aware frontmatter shape on every page
// and preserves unknown fields for custom layouts.
export const DocsFrontmatterSchema = DocsHomeFrontmatterSchema

export type DocsFrontmatter = z.infer<typeof DocsFrontmatterSchema>
