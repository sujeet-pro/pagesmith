// Core modules (re-exported from @pagesmith/core)
export { extractFrontmatter, validateFrontmatter } from '@pagesmith/core'
export type { FrontmatterResult } from '@pagesmith/core'
export { extractToc } from '@pagesmith/core'
export { convert } from '@pagesmith/core'
export type { ConvertOptions, ConvertResult } from '@pagesmith/core'
export { applyLayout } from '@pagesmith/core'
export type { CoreLayoutProps } from '@pagesmith/core'
export { generateDocument } from '@pagesmith/core'
export type { DocumentOptions } from '@pagesmith/core'
export * from './css'
export * from './jsx-runtime'

// Site builder modules
export * from './assets'
export * from './config'

// Build pipeline
export * from './build'

// Content collection
export * from './content'

// Diagrams
export * from './diagrams'

// Generators
export * from './generators'

// Server
export * from './server'

// Validators
export * from './validators'

// Engine schemas (re-exported from top-level schemas/)
export type { BuildOptions, GlobalIndex, PageTask, ProcessedPage } from '../schemas/build-types'
export { type Heading, HeadingSchema } from '../schemas/heading'
