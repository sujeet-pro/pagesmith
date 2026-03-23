/**
 * @pagesmith/content — Content CMS library.
 *
 * Schema-validated collections, lazy markdown rendering, diagrams,
 * asset hashing, and runtime CSS/JS exports.
 */

// ── Config ──
export { defineCollection, defineConfig } from './config'

// ── Content Layer ──
export { type ContentLayer, type ConvertOptions, createContentLayer } from './content-layer'

// ── Entry ──
export { ContentEntry, type RenderedContent } from './entry'

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
export type { ContentLayerConfig, ContentPlugin } from './schemas/config'

// ── Validation ──
export type {
  ContentValidator,
  ValidationEntryResult,
  ValidationIssue,
  ValidationResult,
  ValidatorContext,
} from './validation'
export {
  builtinMarkdownValidators,
  codeBlockValidator,
  headingValidator,
  linkValidator,
  runValidators,
} from './validation'

// ── Loaders ──
export { JsoncLoader, JsonLoader, MarkdownLoader, TomlLoader, YamlLoader } from './loaders'
export type { Loader, LoaderResult, LoaderType } from './loaders/types'

// ── AI Companion Files ──
export {
  getAiArtifactContent,
  getAiArtifacts,
  installAiArtifacts,
  type AiArtifact,
  type AiArtifactKind,
  type AiAssistant,
  type AiInstallOptions,
  type AiInstallResult,
  type AiInstallScope,
} from './ai/index'

// ── Re-export zod for consumer convenience ──
export { z } from 'zod'
