/**
 * Link validator — checks links in markdown content.
 *
 * Walks the shared MDAST for link/image nodes. Internal links are checked for file existence;
 * external links are checked for well-formed URL format.
 */

import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import type { ValidationIssue } from './schema-validator'
import type { ContentValidator, MdastNode, ResolvedValidatorContext } from './types'

/** Extract plain text from a node's children. */
function getTextContent(node: MdastNode): string {
  if (node.type === 'text') return node.value ?? ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

/** Walk MDAST tree, collecting link and image nodes. */
function collectLinks(node: MdastNode): Array<{ url: string; text: string; line?: number }> {
  const links: Array<{ url: string; text: string; line?: number }> = []

  if ((node.type === 'link' || node.type === 'image') && node.url) {
    links.push({
      url: node.url,
      text: node.type === 'link' ? getTextContent(node) : '',
      line: node.position?.start.line,
    })
  }

  if (node.children) {
    for (const child of node.children) {
      links.push(...collectLinks(child))
    }
  }

  return links
}

function isInternalLink(url: string): boolean {
  if (url.startsWith('#')) return false
  if (url.startsWith('http://') || url.startsWith('https://')) return false
  if (url.startsWith('//')) return false
  if (url.startsWith('mailto:')) return false
  if (url.startsWith('tel:')) return false
  if (url.startsWith('data:')) return false
  return true
}

function isWellFormedUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export type LinkValidatorOptions = {
  /** Glob patterns for internal links to skip file-existence checks on. */
  skipPatterns?: string[]
}

export function createLinkValidator(options?: LinkValidatorOptions): ContentValidator {
  const skipPatterns = options?.skipPatterns ?? []

  function shouldSkip(url: string): boolean {
    return skipPatterns.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
        return regex.test(url)
      }
      return url.startsWith(pattern)
    })
  }

  return {
    name: 'links',

    validate(ctx: ResolvedValidatorContext): ValidationIssue[] {
      if (!ctx.rawContent) return []

      const issues: ValidationIssue[] = []
      const tree = ctx.mdast as MdastNode

      const links = collectLinks(tree)
      const fileDir = dirname(ctx.filePath)

      for (const link of links) {
        const lineInfo = link.line ? ` (line ${link.line})` : ''

        // Empty link text — bad accessibility
        if (link.text !== undefined && !link.text.trim()) {
          issues.push({
            field: `links${lineInfo}`,
            message: `Link has no visible text: ${link.url}`,
            severity: 'warn',
          })
        }

        // External links — check URL format
        if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
          if (!isWellFormedUrl(link.url)) {
            issues.push({
              field: `links${lineInfo}`,
              message: `Malformed external URL: ${link.url}`,
              severity: 'warn',
            })
          }
          continue
        }

        // Internal links — check file exists
        if (isInternalLink(link.url)) {
          if (shouldSkip(link.url)) continue

          // Strip fragment and query
          const urlPath = link.url.split('#')[0]!.split('?')[0]!
          if (!urlPath) continue // pure fragment link

          const resolved = resolve(fileDir, urlPath)
          if (!existsSync(resolved)) {
            issues.push({
              field: `links${lineInfo}`,
              message: `Broken internal link: ${link.url}`,
              severity: 'error',
            })
          }
        }
      }

      return issues
    },
  }
}

export const linkValidator: ContentValidator = createLinkValidator()
