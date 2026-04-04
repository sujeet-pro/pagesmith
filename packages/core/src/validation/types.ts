/**
 * Content validator interfaces.
 *
 * Validators run on the raw markdown AST (MDAST) to catch structural
 * issues without needing full HTML conversion.
 */

import type { Root } from 'mdast'
import type { ValidationIssue } from './schema-validator'

/** Shared MDAST node type used by content validators. */
export type MdastNode = {
  type: string
  depth?: number
  url?: string
  lang?: string | null
  meta?: string | null
  value?: string
  children?: MdastNode[]
  position?: { start: { line: number } }
}

/** Context passed to runValidators() — mdast may be absent before parsing. */
export type ValidatorContext = {
  /** Absolute path to the source file */
  filePath: string
  /** URL-friendly slug for this entry */
  slug: string
  /** Collection name this entry belongs to */
  collection: string
  /** Raw markdown body (after frontmatter extraction) */
  rawContent?: string
  /** Parsed frontmatter / data */
  data: Record<string, any>
  /** Pre-parsed MDAST tree shared across validators. */
  mdast?: Root
  /**
   * Look up another entry by collection and slug.
   * Available when running within a content layer context.
   * Returns undefined if the entry doesn't exist or context is unavailable.
   */
  getEntry?: (
    collection: string,
    slug: string,
  ) => { slug: string; data: Record<string, any> } | undefined
}

/** Context provided to each validator — mdast is guaranteed to be present. */
export type ResolvedValidatorContext = Omit<ValidatorContext, 'mdast'> & {
  /** Parsed MDAST tree shared across all validators. */
  mdast: Root
}

/** A single-entry content validator. */
export type ContentValidator = {
  /** Unique validator name (used in error reporting) */
  name: string
  /** Validate a content entry and return any issues found. */
  validate(ctx: ResolvedValidatorContext): ValidationIssue[] | Promise<ValidationIssue[]>
}
