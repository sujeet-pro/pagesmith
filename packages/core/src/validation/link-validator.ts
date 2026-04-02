/**
 * Link validator — checks links in markdown content.
 *
 * Walks the shared MDAST for link/image nodes. Internal links are checked for file existence;
 * external links are checked for well-formed URL format.
 */

import { existsSync } from 'fs'
import { dirname, resolve } from 'path'
import type { ValidationIssue } from './schema-validator'
import type { ContentValidator, MdastNode, ValidatorContext } from './types'

/** Walk MDAST tree, collecting link and image nodes. */
function collectLinks(node: MdastNode): Array<{ url: string; line?: number }> {
  const links: Array<{ url: string; line?: number }> = []

  if ((node.type === 'link' || node.type === 'image') && node.url) {
    links.push({
      url: node.url,
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

export const linkValidator: ContentValidator = {
  name: 'links',

  validate(ctx: ValidatorContext): ValidationIssue[] {
    if (!ctx.rawContent || !ctx.mdast) return []

    const issues: ValidationIssue[] = []
    const tree = ctx.mdast as MdastNode

    const links = collectLinks(tree)
    const fileDir = dirname(ctx.filePath)

    for (const link of links) {
      const lineInfo = link.line ? ` (line ${link.line})` : ''

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
