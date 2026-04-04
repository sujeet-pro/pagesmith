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
  frontmatter: Record<string, unknown>
}

export type { MarkdownConfig }

const DEFAULT_MARKDOWN_CONFIG: MarkdownConfig = {}

/** Default language aliases for fenced code blocks that Shiki doesn't recognize natively. */
const DEFAULT_LANG_ALIASES: Record<string, string> = {
  dot: 'text',
  mermaid: 'text',
  plantuml: 'text',
  excalidraw: 'json',
  drawio: 'xml',
  proto: 'protobuf',
  ejs: 'html',
  hbs: 'handlebars',
}

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

  // Apply language aliases to fenced code blocks before Expressive Code processes them.
  // Merge defaults with user-provided aliases (user overrides take precedence).
  const langAlias = { ...DEFAULT_LANG_ALIASES, ...config.shiki?.langAlias }
  processor.use(() => (tree: any) => {
    const visit = (node: any): void => {
      if (node?.type === 'code' && typeof node.lang === 'string' && langAlias[node.lang]) {
        node.lang = langAlias[node.lang]
      }
      if (Array.isArray(node?.children)) {
        for (const child of node.children) visit(child)
      }
    }
    visit(tree)
  })

  processor.use(remarkRehype, { allowDangerousHtml: true })

  // MathJax must run before Expressive Code so that math elements (from remark-math)
  // are rendered to SVG before Expressive Code tries to highlight them as code blocks.
  processor.use(rehypeMathjax)

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

/**
 * Processor cache keyed by MarkdownConfig object reference.
 *
 * **Why a WeakMap keyed by object reference?**
 * Building a unified processor chain is expensive — it loads Shiki grammars,
 * theme JSON, and instantiates every remark/rehype plugin. Caching the
 * processor by config reference lets callers that reuse the same config object
 * (the common case) skip all of that setup on subsequent calls. The WeakMap
 * also ensures that if a config object is garbage-collected, its processor is
 * too, so long-running processes don't leak memory.
 *
 * **Why is the config frozen?**
 * The cache assumes the config does not change after the processor is built.
 * If a caller mutated a config object after the processor was created, later
 * calls would still receive the stale processor (keyed by the same reference),
 * producing silently wrong output. Freezing the config at first use turns that
 * silent bug into a loud TypeError on any attempted mutation.
 *
 * **What if a consumer needs different settings?**
 * Pass a new config object — a fresh reference gets its own cache entry.
 * For example: `processMarkdown(md, { ...existingConfig, remarkPlugins: [...] })`.
 */
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
  // Freeze to prevent mutation after caching — see processorCache JSDoc above.
  if (Object.isFrozen(resolvedConfig) === false) Object.freeze(resolvedConfig)
  let processor = processorCache.get(resolvedConfig)
  if (!processor) {
    processor = createProcessor(resolvedConfig)
    processorCache.set(resolvedConfig, processor)
  }
  try {
    const result = await processor.process(content)
    const headings = Array.isArray(result.data.headings) ? (result.data.headings as Heading[]) : []
    return { html: String(result), headings, frontmatter }
  } catch (err) {
    throw new Error(
      `Markdown processing failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    )
  }
}
