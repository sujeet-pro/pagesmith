// JSX runtime
export { Fragment, h, HtmlString } from './jsx-runtime'

// Markdown processing
export { processMarkdown } from './markdown'
export type { MarkdownResult } from './markdown'

// Markdown plugins
export { codeBlockTransformers, rehypeCodeTabs } from './markdown/plugins'

// CSS builder
export { buildCss } from './css'

// Frontmatter
export { extractFrontmatter, validateFrontmatter } from './frontmatter'
export type { FrontmatterResult } from './frontmatter'

// TOC extraction
export { extractToc } from './toc'

// Document generation
export { generateDocument } from './document'
export type { DocumentOptions } from './document'

// Layout engine
export { applyLayout } from './layout-engine'
export type { CoreLayoutProps } from './layout-engine'

// Convert API
export { convert } from './convert'
export type { ConvertOptions, ConvertResult } from './convert'

// Schemas
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
} from './schemas'
