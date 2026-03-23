import type { Heading } from './schemas/heading'

/**
 * Extract table of contents headings from an HTML string.
 *
 * Regex-based: finds <h[1-6] id="...">text</h[1-6]>, strips inner HTML tags.
 * No dependency on unified — works on any HTML string.
 */
export function extractToc(html: string): Heading[] {
  const headings: Heading[] = []
  const re = /<h([1-6])\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/gi
  let match: RegExpExecArray | null

  while ((match = re.exec(html)) !== null) {
    const depth = parseInt(match[1], 10)
    const slug = match[2]
    // Strip inner HTML tags to get plain text
    const text = match[3].replace(/<[^>]+>/g, '').trim()
    headings.push({ depth, text, slug })
  }

  return headings
}
