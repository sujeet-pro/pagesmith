/**
 * High-level content validator — walk a content directory, parse every
 * markdown file, validate its frontmatter against an optional schema, and run
 * link / image / heading / code-block validators over the body.
 *
 * This API is intentionally dependency-light and synchronous-friendly so it
 * can be called from both the `pagesmith-site validate` and
 * `pagesmith-docs validate` CLIs. Network-based checks (external URL
 * reachability) are opt-in.
 *
 * The returned summary is structured so callers can render custom reports or
 * gate CI pipelines on the `errors` count.
 */

import { readFile } from 'fs/promises'
import { basename, extname, relative } from 'path'
import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'
import fg from 'fast-glob'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { ZodType } from 'zod'
import { codeBlockValidator } from './code-block-validator'
import { headingValidator } from './heading-validator'
import { createLinkValidator, type LinkValidatorOptions } from './link-validator'
import { runValidators } from './runner'
import { validateSchema, type ValidationIssue } from './schema-validator'
import type { ContentValidator } from './types'

export type ValidateContentOptions = {
  /**
   * Absolute path to the content directory. All markdown files below this
   * directory will be walked.
   */
  contentDir: string

  /**
   * Glob patterns (relative to `contentDir`) used to locate markdown files.
   * Default: `['**\/*.md', '**\/*.mdx']`.
   */
  include?: string[]

  /** Glob patterns to exclude. Default: `['**\/node_modules/**']`. */
  exclude?: string[]

  /**
   * Optional Zod schema to validate the frontmatter of every file. Applies
   * uniformly to every entry. Use {@link resolveFrontmatterSchema} when the
   * schema differs by collection / file location.
   *
   * When omitted, only structural validators (links, images, headings, code
   * blocks) run and frontmatter is accepted as-is.
   */
  frontmatterSchema?: ZodType

  /**
   * Per-file frontmatter schema lookup. Invoked once per markdown file with
   * the absolute path; return `undefined` to skip schema validation for that
   * file (structural validators still run). Takes precedence over
   * {@link frontmatterSchema}.
   *
   * Typical use: pair with `loadContentSchemaMap` to validate each file
   * against the schema declared in the project's `content.config.ts`.
   */
  resolveFrontmatterSchema?: (filePath: string) => ZodType | undefined

  /**
   * Forwarded to {@link createLinkValidator}. Useful for site-absolute links
   * (set `rootDir` + `basePath`), restricting allowed internal targets, and
   * opting into external URL reachability checks.
   */
  linkValidator?: LinkValidatorOptions

  /**
   * Additional custom validators to run on every entry. They receive the
   * parsed MDAST alongside the raw content and frontmatter.
   */
  extraValidators?: ContentValidator[]

  /**
   * Whether to include the built-in heading / code-block validators.
   * Default: `true`.
   */
  includeStructuralValidators?: boolean

  /**
   * Collection name recorded on results. Default: `'content'`.
   */
  collectionName?: string
}

export type ContentFileResult = {
  /** Absolute source file path. */
  filePath: string
  /** Path relative to `contentDir`. */
  relativePath: string
  /** Human-readable slug derived from the file path. */
  slug: string
  /** Issues produced by schema + structural validators. */
  issues: ValidationIssue[]
}

export type ValidateContentSummary = {
  collection: string
  contentDir: string
  fileCount: number
  errors: number
  warnings: number
  results: ContentFileResult[]
}

/** Convert a relative markdown path into a slug. */
function toSlug(relativePath: string): string {
  const ext = extname(relativePath)
  const withoutExt = ext ? relativePath.slice(0, -ext.length) : relativePath
  const normalized = withoutExt.replace(/\\/g, '/')
  if (basename(normalized) === 'README') {
    const dir = normalized.replace(/\/README$/, '')
    return dir === '' ? '/' : `/${dir}`
  }
  return `/${normalized}`
}

/**
 * Validate every markdown file in a content directory.
 *
 * The returned summary aggregates schema + content validator issues and
 * includes totals so CLIs can trivially produce pass/fail exit codes.
 */
export async function validateContent(
  options: ValidateContentOptions,
): Promise<ValidateContentSummary> {
  const {
    contentDir,
    include = ['**/*.md', '**/*.mdx'],
    exclude = ['**/node_modules/**'],
    frontmatterSchema,
    resolveFrontmatterSchema,
    linkValidator,
    extraValidators = [],
    includeStructuralValidators = true,
    collectionName = 'content',
  } = options

  const files = await fg(include, {
    cwd: contentDir,
    absolute: true,
    ignore: exclude,
    dot: false,
    onlyFiles: true,
  })
  files.sort()

  const validators: ContentValidator[] = []
  validators.push(createLinkValidator(linkValidator))
  if (includeStructuralValidators) {
    validators.push(codeBlockValidator)
    validators.push(headingValidator)
  }
  validators.push(...extraValidators)

  const results: ContentFileResult[] = []
  let errors = 0
  let warnings = 0

  for (const filePath of files) {
    const rel = relative(contentDir, filePath)
    const slug = toSlug(rel)
    const issues: ValidationIssue[] = []

    let data: Record<string, unknown> = {}
    let body = ''
    try {
      const raw = await readFile(filePath, 'utf-8')
      const parsed = matter(raw, { engines: { yaml: parseYaml } })
      data = (parsed.data as Record<string, unknown>) ?? {}
      body = parsed.content
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      issues.push({
        message: `Failed to parse markdown: ${message}`,
        severity: 'error',
        source: 'content',
      })
      results.push({ filePath, relativePath: rel, slug, issues })
      errors += 1
      continue
    }

    const schema = resolveFrontmatterSchema?.(filePath) ?? frontmatterSchema
    if (schema) {
      const { issues: schemaIssues, validatedData } = validateSchema(data, schema)
      issues.push(...schemaIssues)
      data = validatedData as Record<string, unknown>
    }

    try {
      const mdast = unified().use(remarkParse).parse(body)
      const contentIssues = await runValidators(
        {
          filePath,
          slug,
          collection: collectionName,
          rawContent: body,
          data,
          mdast,
        },
        validators,
      )
      issues.push(...contentIssues)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      issues.push({
        message: `Validator pipeline threw: ${message}`,
        severity: 'error',
        source: 'content',
      })
    }

    for (const issue of issues) {
      if (issue.severity === 'error') errors += 1
      else warnings += 1
    }
    results.push({ filePath, relativePath: rel, slug, issues })
  }

  return {
    collection: collectionName,
    contentDir,
    fileCount: files.length,
    errors,
    warnings,
    results,
  }
}

/**
 * Render a human-readable report from a {@link ValidateContentSummary}.
 *
 * Designed for CLIs: the returned string is suitable for `console.log`
 * directly. Empty when there are no issues.
 */
export function formatContentValidationReport(
  summary: ValidateContentSummary,
  options?: { showClean?: boolean },
): string {
  const showClean = options?.showClean ?? false
  const lines: string[] = []
  for (const result of summary.results) {
    if (result.issues.length === 0) {
      if (showClean) lines.push(`OK ${result.relativePath}`)
      continue
    }
    lines.push(`${result.relativePath}`)
    for (const issue of result.issues) {
      const prefix = issue.severity === 'error' ? '  \u2717' : '  \u26A0'
      const field = issue.field ? ` [${issue.field}]` : ''
      lines.push(`${prefix}${field} ${issue.message}`)
    }
  }
  lines.push('')
  lines.push(
    `${summary.fileCount} files validated — ${summary.errors} error(s), ${summary.warnings} warning(s)`,
  )
  return lines.join('\n')
}
