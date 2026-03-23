/**
 * Collection configuration schema.
 */

import { z } from 'zod'
import type { Loader, LoaderType } from '../loaders/types'
import type { ContentValidator } from '../validation/types'

/** Raw entry before validation — what a loader returns plus file metadata. */
export type RawEntry = {
  data: Record<string, any>
  content?: string
  filePath: string
  slug: string
}

/** Collection definition — passed to defineCollection(). */
export type CollectionDef<S extends z.ZodType = z.ZodType> = {
  /** Loader type or custom Loader instance */
  loader: LoaderType | Loader
  /** Directory containing collection files (relative to rootDir) */
  directory: string
  /** Zod schema for validating entry data */
  schema: S
  /** Glob patterns to include (defaults based on loader type) */
  include?: string[]
  /** Glob patterns to exclude */
  exclude?: string[]
  /** Computed fields derived from entry data/content */
  computed?: Record<string, (entry: RawEntry) => any>
  /** Custom validation hook (return string for error, undefined for pass) */
  validate?: (entry: RawEntry) => string | undefined
  /** Filter entries (return false to exclude) */
  filter?: (entry: RawEntry) => boolean
  /** Custom slug generation */
  slugify?: (filePath: string, directory: string) => string
  /** Pre-validation transform */
  transform?: (entry: RawEntry) => RawEntry | Promise<RawEntry>
  /** Custom content validators (appended to built-in markdown validators) */
  validators?: ContentValidator[]
  /** Disable built-in markdown validators (link, code-block, heading) */
  disableBuiltinValidators?: boolean
}
