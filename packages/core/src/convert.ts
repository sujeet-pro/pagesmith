import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { HtmlString } from './jsx-runtime'
import type { CoreLayoutProps } from './layout-engine'
import { applyLayout } from './layout-engine'
import { processMarkdown } from './markdown'
import type { Heading } from './schemas/heading'
import type { MarkdownConfig } from './schemas/markdown-config'
import { extractToc } from './toc'

export type ConvertOptions = {
  markdown?: MarkdownConfig
  mode?: 'full' | 'fragment'
  layout?: (props: CoreLayoutProps) => HtmlString
  css?: 'inline' | 'reference' | 'none'
  js?: 'inline' | 'reference' | 'none'
  cssPath?: string
  jsPath?: string
  noToc?: boolean
}

export type ConvertResult = {
  html: string
  toc: Heading[]
  frontmatter: Record<string, any>
}

function getPackageDir(): string {
  const thisFile = fileURLToPath(import.meta.url)
  // In dist: packages/core/dist/convert.js -> packages/core/
  // In src:  packages/core/src/convert.ts  -> packages/core/
  return join(dirname(thisFile), '..')
}

function readBundledAsset(filename: string): string {
  const pkgDir = getPackageDir()
  // Try dist/ first (built package), then src/ (development)
  for (const dir of ['dist', 'src']) {
    try {
      return readFileSync(join(pkgDir, dir, filename), 'utf-8')
    } catch (err: any) {
      if (err?.code !== 'ENOENT') console.warn(`Failed to read bundled asset: ${err?.message}`)
    }
  }
  return ''
}

export async function convert(input: string, options: ConvertOptions = {}): Promise<ConvertResult> {
  const mode = options.mode || 'full'
  const result = await processMarkdown(input, options.markdown || {})
  const toc = extractToc(result.html)

  if (mode === 'fragment') {
    return { html: result.html, toc, frontmatter: result.frontmatter }
  }

  // Full mode — wrap in layout
  const cssMode = options.css || 'inline'
  const jsMode = options.js || 'inline'

  if (options.layout) {
    // Custom layout
    const props: CoreLayoutProps = {
      content: result.html,
      frontmatter: result.frontmatter,
      headings: toc,
    }
    const html = applyLayout(options.layout, props)
    return { html, toc, frontmatter: result.frontmatter }
  }

  // Default standalone layout
  const { standaloneLayout } = await import('./layouts/standalone.js')

  let css: string | string[] | undefined
  if (cssMode === 'inline') {
    css = readBundledAsset('standalone.css')
  } else if (cssMode === 'reference') {
    css = options.cssPath || '/assets/standalone.css'
  }

  let js: string | string[] | undefined
  if (jsMode === 'inline') {
    js = readBundledAsset('standalone.js')
  } else if (jsMode === 'reference') {
    js = options.jsPath || '/assets/standalone.js'
  }

  const props: CoreLayoutProps = {
    content: result.html,
    frontmatter: result.frontmatter,
    headings: toc,
    css,
    cssMode,
    js,
    jsMode,
    noToc: options.noToc,
  }

  const html = applyLayout(standaloneLayout, props)
  return { html, toc, frontmatter: result.frontmatter }
}
