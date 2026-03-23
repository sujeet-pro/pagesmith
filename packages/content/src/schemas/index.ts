export type { CollectionDef, RawEntry } from './collection'
export type { ContentLayerConfig, ContentPlugin } from './config'

// Re-export core schemas
export {
  type BaseFrontmatter,
  BaseFrontmatterSchema,
  type BlogFrontmatter,
  BlogFrontmatterSchema,
  type Heading,
  HeadingSchema,
  type MarkdownConfig,
  MarkdownConfigSchema,
  type ProjectFrontmatter,
  ProjectFrontmatterSchema,
} from '@pagesmith/core'
