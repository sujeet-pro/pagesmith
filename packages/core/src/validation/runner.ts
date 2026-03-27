/**
 * Validation runner — executes a list of content validators on an entry.
 *
 * Validators that throw are caught and converted to error-severity issues
 * so one failing validator does not block the rest.
 */

import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { ValidationIssue } from './schema-validator'
import type { ContentValidator, ValidatorContext } from './types'

import { codeBlockValidator } from './code-block-validator'
import { headingValidator } from './heading-validator'
import { linkValidator } from './link-validator'

/** The built-in validators for markdown content. */
export const builtinMarkdownValidators: ContentValidator[] = [
  linkValidator,
  codeBlockValidator,
  headingValidator,
]

/** Run all validators on a single content entry. */
export async function runValidators(
  ctx: ValidatorContext,
  validators: ContentValidator[],
): Promise<ValidationIssue[]> {
  if (ctx.rawContent && !ctx.mdast) {
    ctx.mdast = unified().use(remarkParse).parse(ctx.rawContent)
  }

  const issues: ValidationIssue[] = []

  for (const validator of validators) {
    try {
      const result = await validator.validate(ctx)
      issues.push(...result)
    } catch (err) {
      // Convert thrown errors into issues so one bad validator doesn't abort all
      const message = err instanceof Error ? err.message : String(err)
      issues.push({
        message: `Validator "${validator.name}" threw: ${message}`,
        severity: 'error',
      })
    }
  }

  return issues
}
