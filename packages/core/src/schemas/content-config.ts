/**
 * Content layer configuration schema.
 */

import type { MarkdownConfig } from './markdown-config'
import type { CollectionMap } from './collection'

/** Content layer configuration — passed to defineConfig(). */
export type ContentLayerConfig = {
  /** Named collections */
  collections: CollectionMap
  /** Root directory for resolving relative paths (defaults to cwd()) */
  root?: string
  /** Markdown processing config (shared with the markdown pipeline). */
  markdown?: MarkdownConfig
  /** Asset hashing config */
  assets?: {
    /** Enable content-hash filenames */
    hashFilenames?: boolean
    /** Output directory for hashed assets */
    outputDir?: string
  }
  /** Enable in-memory caching of loaded entries */
  cache?: boolean
  /** Load all entries eagerly on creation */
  eager?: boolean
  /** Content plugins */
  plugins?: ContentPlugin[]
}

/** Plugin interface for processing + validation. */
export type ContentPlugin = {
  name: string
  /** Rehype plugin for markdown AST transformation */
  rehypePlugin?: () => (tree: any) => void
  /** Remark plugin for markdown AST transformation */
  remarkPlugin?: () => (tree: any) => void
  /** Validate plugin-specific metadata on each entry */
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[]
}
