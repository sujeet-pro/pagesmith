import { processMarkdown } from './markdown'
import type { Heading } from './schemas/heading'
import type { MarkdownConfig } from './schemas/markdown-config'

export type ConvertOptions = {
  markdown?: MarkdownConfig
}

export type ConvertResult = {
  html: string
  headings: Heading[]
  /** @deprecated Use `headings` for consistency with `processMarkdown()` and `entry.render()`. */
  toc: Heading[]
  frontmatter: Record<string, unknown>
}

export async function convert(input: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const result = await processMarkdown(input, options.markdown || {})
  return {
    html: result.html,
    headings: result.headings,
    toc: result.headings,
    frontmatter: result.frontmatter,
  }
}
