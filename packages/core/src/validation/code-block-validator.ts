/**
 * Code block validator — checks fenced code block meta syntax.
 *
 * Walks the shared MDAST for `code` nodes. Validates known meta properties
 * and language identifiers. Meta syntax follows Expressive Code conventions.
 */

import type { ValidationIssue } from './schema-validator'
import type { ContentValidator, ValidatorContext } from './types'

type MdastNode = {
  type: string
  lang?: string | null
  meta?: string | null
  value?: string
  children?: MdastNode[]
  position?: { start: { line: number } }
}

/** Known meta properties accepted by Expressive Code and its plugins. */
const KNOWN_META_PROPS = new Set([
  'title',
  'showLineNumbers',
  'startLineNumber',
  'wrap',
  'frame',
  'collapse',
  'mark',
  'ins',
  'del',
])

/** Extract the property name portion of a meta token (before `=` or `{`). */
function extractMetaPropNames(meta: string): string[] {
  const props: string[] = []

  // Match key=value, key={...}, or bare flags
  const tokenRegex = /(\w+)(?:=(?:\{[^}]*\}|"[^"]*"|'[^']*'|\S+))?/g
  let match: RegExpExecArray | null
  while ((match = tokenRegex.exec(meta)) !== null) {
    props.push(match[1]!)
  }

  return props
}

/** Collect all `code` nodes from MDAST. */
function collectCodeBlocks(node: MdastNode): MdastNode[] {
  const blocks: MdastNode[] = []

  if (node.type === 'code') {
    blocks.push(node)
  }

  if (node.children) {
    for (const child of node.children) {
      blocks.push(...collectCodeBlocks(child))
    }
  }

  return blocks
}

export const codeBlockValidator: ContentValidator = {
  name: 'code-blocks',

  validate(ctx: ValidatorContext): ValidationIssue[] {
    if (!ctx.rawContent || !ctx.mdast) return []

    const issues: ValidationIssue[] = []
    const tree = ctx.mdast as MdastNode

    const codeBlocks = collectCodeBlocks(tree)

    for (const block of codeBlocks) {
      const line = block.position?.start.line
      const lineInfo = line ? ` (line ${line})` : ''
      const meta = block.meta ?? ''
      const hasMeta = meta.trim().length > 0

      // Language required when using syntax features
      if (hasMeta && !block.lang) {
        issues.push({
          field: `code-block${lineInfo}`,
          message: 'Code block has meta properties but no language identifier',
          severity: 'warn',
        })
      }

      if (!hasMeta) continue

      // Check for unknown meta properties
      const propNames = extractMetaPropNames(meta)
      for (const prop of propNames) {
        if (!KNOWN_META_PROPS.has(prop)) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Unknown code block meta property: "${prop}"`,
            severity: 'warn',
          })
        }
      }
    }

    return issues
  },
}
