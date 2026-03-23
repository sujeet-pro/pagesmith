import rehypeShiki from '@shikijs/rehype'
import matter from 'gray-matter'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeMathjax from 'rehype-mathjax/svg'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import type { Heading } from '../schemas/heading'
import type { MarkdownConfig } from '../schemas/markdown-config'
import rehypeCodeTabs from './plugins/rehype-code-tabs'
import { codeBlockTransformers } from './plugins/shiki-transformers'

export type MarkdownResult = {
  html: string
  headings: Heading[]
  frontmatter: Record<string, any>
}

export type { MarkdownConfig }

const DEFAULT_MARKDOWN_CONFIG: MarkdownConfig = {}

function getTextContent(node: any): string {
  if (node.type === 'text') return node.value || ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

function extractHeadings(tree: any, headings: Heading[]): void {
  if (tree.type === 'element' && /^h[1-6]$/.test(tree.tagName)) {
    headings.push({
      depth: parseInt(tree.tagName[1]),
      text: getTextContent(tree),
      slug: tree.properties?.id || '',
    })
  }
  if (tree.children) {
    for (const child of tree.children) {
      extractHeadings(child, headings)
    }
  }
}

function createProcessor(config: MarkdownConfig) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkFrontmatter, ['yaml'])

  if (config.remarkPlugins) {
    for (const plugin of config.remarkPlugins) {
      if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1])
      else processor.use(plugin)
    }
  }

  processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeMathjax)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })

  const themes = config.shiki?.themes || { light: 'github-light', dark: 'github-dark' }
  const langAlias = config.shiki?.langAlias
  const defaultShowLineNumbers = config.shiki?.defaultShowLineNumbers ?? true
  processor.use(rehypeShiki, {
    themes,
    defaultColor: false,
    ...(langAlias ? { langAlias } : {}),
    transformers: codeBlockTransformers({ defaultShowLineNumbers }),
    parseMetaString: (meta) => {
      return { __raw: meta }
    },
  })

  processor.use(rehypeCodeTabs)
  processor.use(() => (tree: any, file: any) => {
    const headings: Heading[] = []
    extractHeadings(tree, headings)
    file.data.headings = headings
  })

  if (config.rehypePlugins) {
    for (const plugin of config.rehypePlugins) {
      if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1])
      else processor.use(plugin)
    }
  }

  processor.use(rehypeStringify, { allowDangerousHtml: true })
  return processor
}

const processorCache = new WeakMap<MarkdownConfig, ReturnType<typeof createProcessor>>()

export async function processMarkdown(
  raw: string,
  config?: MarkdownConfig,
): Promise<MarkdownResult> {
  const { data: frontmatter, content } = matter(raw)
  const resolvedConfig = config && Object.keys(config).length > 0 ? config : DEFAULT_MARKDOWN_CONFIG
  let processor = processorCache.get(resolvedConfig)
  if (!processor) {
    processor = createProcessor(resolvedConfig)
    processorCache.set(resolvedConfig, processor)
  }
  const result = await processor.process(content)
  const headings = Array.isArray(result.data.headings) ? (result.data.headings as Heading[]) : []

  return { html: String(result), headings, frontmatter }
}
