import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeExpressiveCode, {
  type BundledShikiTheme,
  type RehypeExpressiveCodeOptions,
} from 'rehype-expressive-code'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeMathjax from 'rehype-mathjax/svg'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkGithubAlerts from 'remark-github-alerts'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkSmartypants from 'remark-smartypants'
import { unified } from 'unified'
import type { Heading } from '../schemas/heading'
import type { MarkdownConfig } from '../schemas/markdown-config'

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
    // GitHub-flavored alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    .use(remarkGithubAlerts)
    // Smart typography: "smart quotes", em—dashes, el…lipses
    .use(remarkSmartypants)

  if (config.remarkPlugins) {
    for (const plugin of config.remarkPlugins) {
      if (Array.isArray(plugin)) processor.use(plugin[0], plugin[1])
      else processor.use(plugin)
    }
  }

  processor.use(remarkRehype, { allowDangerousHtml: true })

  // Expressive Code — syntax highlighting, code frames, tabs, copy button
  const lightTheme = (config.shiki?.themes?.light || 'github-light') as BundledShikiTheme
  const darkTheme = (config.shiki?.themes?.dark || 'github-dark') as BundledShikiTheme

  processor.use(rehypeExpressiveCode, {
    themes: [darkTheme, lightTheme],
    useDarkModeMediaQuery: true,
    styleOverrides: {
      uiFontFamily: 'var(--ps-font-sans, var(--font-family, system-ui, sans-serif))',
      codeFontFamily: 'var(--ps-font-mono, var(--font-mono, ui-monospace, monospace))',
      codeFontSize: 'var(--ps-font-size-sm, 0.875rem)',
      codeLineHeight: '1.7',
      borderRadius: 'var(--ps-radius-lg, 0.5rem)',
      borderColor: 'var(--ps-color-border-subtle, var(--color-border-subtle, #e5e7eb))',
    },
  } satisfies RehypeExpressiveCodeOptions)

  processor
    .use(rehypeMathjax)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    // External links: add target="_blank" rel="noopener noreferrer" to absolute URLs
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
    // Accessible emojis: wrap emoji characters in <span role="img" aria-label="...">
    .use(rehypeAccessibleEmojis)

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
  preExtracted?: { content: string; frontmatter: Record<string, unknown> },
): Promise<MarkdownResult> {
  let frontmatter: Record<string, unknown>
  let content: string
  if (preExtracted) {
    frontmatter = preExtracted.frontmatter
    content = preExtracted.content
  } else {
    const parsed = matter(raw, { engines: { yaml: parseYaml } })
    frontmatter = parsed.data
    content = parsed.content
  }
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
