/**
 * ContentEntry — represents a single content entry in a collection.
 *
 * Supports lazy rendering: data is available immediately after loading,
 * but HTML rendering is deferred until render() is called.
 */

import type { Heading } from './schemas/heading'
import type { MarkdownConfig } from './schemas/markdown-config'
import { processMarkdown } from './markdown'
import { computeReadTime } from './utils/read-time'

export type RenderedContent = {
  /** Processed HTML */
  html: string
  /** Extracted headings for TOC */
  headings: Heading[]
  /** Estimated read time in minutes */
  readTime: number
}

export class ContentEntry<T = Record<string, any>> {
  /** URL-friendly identifier */
  readonly slug: string
  /** Collection this entry belongs to */
  readonly collection: string
  /** Absolute path to source file */
  readonly filePath: string
  /** Validated data (frontmatter or parsed data) */
  readonly data: T
  /** Raw body content (markdown only) */
  readonly rawContent?: string

  /** Cached render result */
  private _rendered?: RenderedContent
  /** Markdown config for rendering */
  private _markdownConfig: MarkdownConfig

  constructor(
    slug: string,
    collection: string,
    filePath: string,
    data: T,
    rawContent: string | undefined,
    markdownConfig: MarkdownConfig,
  ) {
    this.slug = slug
    this.collection = collection
    this.filePath = filePath
    this.data = data
    this.rawContent = rawContent
    this._markdownConfig = markdownConfig
  }

  /** Render the entry content to HTML. Cached after first call. */
  async render(options?: { force?: boolean }): Promise<RenderedContent> {
    if (this._rendered && !options?.force) {
      return this._rendered
    }

    if (!this.rawContent) {
      // Non-markdown entries have no renderable content
      this._rendered = { html: '', headings: [], readTime: 0 }
      return this._rendered
    }

    const result = await processMarkdown(this.rawContent, this._markdownConfig, {
      content: this.rawContent,
      frontmatter: this.data as Record<string, unknown>,
    })
    const readTime = computeReadTime(this.rawContent)

    this._rendered = {
      html: result.html,
      headings: result.headings,
      readTime,
    }

    return this._rendered
  }

  /** Clear cached render result. */
  clearRenderCache(): void {
    this._rendered = undefined
  }
}
