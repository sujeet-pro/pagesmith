import { processMarkdown } from './markdown'
import type { Heading } from './schemas/heading'
import type { MarkdownConfig } from './schemas/markdown-config'

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
  return { html: result.html, toc: result.headings, frontmatter: result.frontmatter }
}
