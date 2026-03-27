/**
 * Code block validator — checks fenced code block meta syntax.
 *
 * Walks the shared MDAST for `code` nodes. Validates collapse ranges, known meta properties,
 * and language identifiers.
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

/** Known meta properties accepted by shiki-transformers and rehype-code-tabs. */
const KNOWN_META_PROPS = new Set(['title', 'hideLineNumbers', 'collapse', 'mark', 'ins', 'del'])

/** Parse collapse ranges from meta string (same syntax as shiki-transformers). */
function parseCollapseRanges(meta: string): Array<[number, number]> {
  const match = meta.match(/collapse=\{([^}]+)\}/)
  if (!match) return []
  return match[1]!.split(',').map((part) => {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number)
      return [a!, b!] as [number, number]
    }
    const n = Number(trimmed)
    return [n, n] as [number, number]
  })
}

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
      const bodyLines = (block.value ?? '').split('\n').length
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

      // Validate collapse ranges
      const collapseRanges = parseCollapseRanges(meta)
      for (const [start, end] of collapseRanges) {
        if (start < 1) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Collapse range start ${start} is less than 1`,
            severity: 'error',
          })
        }
        if (start > end) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Collapse range start (${start}) is greater than end (${end})`,
            severity: 'error',
          })
        }
        if (end > bodyLines) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Collapse range ${start}-${end} exceeds line count (${bodyLines} lines)`,
            severity: 'warn',
          })
        }
        if (start > bodyLines) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Collapse range ${start}-${end} starts beyond line count (${bodyLines} lines)`,
            severity: 'warn',
          })
        }
      }

      // Check overlapping collapse ranges
      const sorted = [...collapseRanges].sort((a, b) => a[0] - b[0])
      for (let k = 1; k < sorted.length; k++) {
        const prev = sorted[k - 1]!
        const curr = sorted[k]!
        if (curr[0] <= prev[1]) {
          issues.push({
            field: `code-block${lineInfo}`,
            message: `Collapse ranges ${prev[0]}-${prev[1]} and ${curr[0]}-${curr[1]} overlap`,
            severity: 'error',
          })
        }
      }
    }

    return issues
  },
}
