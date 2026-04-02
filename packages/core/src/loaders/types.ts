/**
 * Loader interface for content formats.
 *
 * Each loader handles a set of file extensions and knows how to parse
 * raw file content into structured data + optional body text.
 */

export type LoaderType = 'markdown' | 'json' | 'json5' | 'jsonc' | 'yaml' | 'toml'
export type LoaderKind = 'markdown' | 'data'

export interface LoaderResult {
  /** Parsed data (frontmatter for markdown, full object for JSON/YAML/TOML) */
  data: Record<string, any>
  /** Raw body content (only markdown loaders provide this) */
  content?: string
}

export interface Loader {
  /** Loader name for error messages */
  name: string
  /** High-level content shape produced by the loader. */
  kind: LoaderKind
  /** File extensions this loader handles */
  extensions: string[]
  /** Parse raw file content into data + optional body */
  load(filePath: string): Promise<LoaderResult>
}
