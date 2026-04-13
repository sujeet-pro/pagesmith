/**
 * pagesmith — Headless content layer.
 *
 * Schema-validated collections, lazy markdown rendering,
 * content validation, and Vite content access.
 */

// ── Config ──
export { defineCollection, defineCollections, defineConfig } from './config'

// ── Content Layer ──
export {
  type ContentLayer,
  type LayerConvertOptions,
  type TypedContentLayer,
  type WatchCallback,
  type WatchEvent,
  type WatchHandle,
  createContentLayer,
} from './content-layer'

// ── Entry ──
export { ContentEntry, type RenderedContent } from './entry'

// ── Markdown Processing ──
export { processMarkdown } from './markdown'
export type { MarkdownResult } from './markdown'

// ── Frontmatter ──
export { extractFrontmatter, validateFrontmatter } from './frontmatter'
export type { FrontmatterResult } from './frontmatter'

// ── TOC Extraction ──
export { extractToc } from './toc'

// ── Convert API ──
export { convert } from './convert'
export type { ConvertOptions, ConvertResult } from './convert'

// ── Schemas & Types ──
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
export type { CollectionDef, RawEntry } from './schemas/collection'
export type {
  CollectionComputed,
  CollectionMap,
  InferCollectionData,
  InferCollectionLoaderKind,
} from './schemas/collection'
export type { ContentLayerConfig, ContentPlugin } from './schemas/content-config'

// ── Validation ──
export type {
  ContentValidator,
  ResolvedValidatorContext,
  ValidationEntryResult,
  ValidationIssue,
  ValidationResult,
  ValidatorContext,
} from './validation'
export {
  builtinMarkdownValidators,
  codeBlockValidator,
  createLinkValidator,
  headingValidator,
  linkValidator,
  runValidators,
} from './validation'

// ── Loaders ──
export {
  defaultIncludePatterns,
  JsoncLoader,
  JsonLoader,
  LoaderError,
  MarkdownLoader,
  resolveLoader,
  registerLoader,
  TomlLoader,
  YamlLoader,
} from './loaders'
export type { Loader, LoaderResult, LoaderType } from './loaders/types'

// ── Re-export zod for consumer convenience ──
export { z } from 'zod'
