import { processMarkdown } from './markdown'
import type { Heading } from './schemas/heading'
import type { MarkdownConfig } from './schemas/markdown-config'
import { extractToc } from './toc'

export type ConvertOptions = {
  markdown?: MarkdownConfig
}

export type ConvertResult = {
  html: string
  toc: Heading[]
  frontmatter: Record<string, any>
}

export async function convert(input: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const result = await processMarkdown(input, options.markdown || {})
  const toc = extractToc(result.html)
  return { html: result.html, toc, frontmatter: result.frontmatter }
}
