/**
 * Content layer configuration schema.
 */

import type { MarkdownConfig } from '@pagesmith/core'
import type { DiagramType, OutputFormat, Theme } from 'diagramkit'
import type { CollectionDef } from './collection'

/** Content layer configuration — passed to defineConfig(). */
export type ContentLayerConfig = {
  /** Named collections */
  collections: Record<string, CollectionDef<any>>
  /** Root directory for resolving relative paths (defaults to cwd()) */
  root?: string
  /** Markdown processing config (passed to @pagesmith/core) */
  markdown?: MarkdownConfig
  /** Diagram rendering config */
  diagrams?: {
    /** Enable auto-rendering of .mermaid/.excalidraw files */
    enabled?: boolean
    /** Light/dark diagram output switching mode in rendered HTML. */
    displayMode?: 'picture' | 'class'
    /** Output directory for generated SVGs (relative to content) */
    outputDir?: string
    /** Manifest filename used for incremental diagram builds. */
    manifestFile?: string
    /** Disable manifest-based incremental diagram builds. */
    useManifest?: boolean
    /** Write generated outputs alongside the source file. */
    sameFolder?: boolean
    /** Override or extend supported diagram file extensions. */
    extensionMap?: Record<string, DiagramType>
    /** Default output format passed to diagramkit. */
    defaultFormat?: OutputFormat
    /** Default theme mode passed to diagramkit. */
    defaultTheme?: Theme
  }
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
