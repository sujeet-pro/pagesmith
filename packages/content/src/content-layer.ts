/**
 * ContentLayer — the main API for working with content collections.
 *
 * Created via createContentLayer(config). Provides methods to:
 * - Load and query collections (getCollection, getEntry)
 * - Convert markdown directly (convert)
 * - Invalidate cache (invalidate, invalidateCollection, invalidateAll)
 * - Validate all entries (validate)
 * - Render diagrams (renderDiagrams)
 */

import type { ConvertResult, MarkdownConfig } from '@pagesmith/core'
import type { ContentEntry } from './entry'
import type { CollectionDef } from './schemas/collection'
import type { ContentLayerConfig } from './schemas/config'
import { ContentStore } from './store'
import type { ValidationResult } from './validation'

export interface ContentLayer {
  /** Get all entries in a collection. */
  getCollection(name: string): Promise<ContentEntry<any>[]>

  /** Get a single entry by collection name and slug. */
  getEntry(collection: string, slug: string): Promise<ContentEntry<any> | undefined>

  /** Convert raw markdown to HTML (no collection, no validation). */
  convert(markdown: string, options?: ConvertOptions): Promise<ConvertResult>

  /** Invalidate a single entry's cache. */
  invalidate(collection: string, slug: string): void

  /** Invalidate an entire collection's cache. */
  invalidateCollection(collection: string): void

  /** Invalidate all cached data. */
  invalidateAll(): void

  /** Validate all entries in a collection (or all collections). */
  validate(collection?: string): Promise<ValidationResult[]>

  /** Render all diagrams in content directories. */
  renderDiagrams(options?: { force?: boolean }): Promise<void>

  /** Get the names of all configured collections. */
  getCollectionNames(): string[]

  /** Get the definition of a collection. */
  getCollectionDef(name: string): CollectionDef | undefined
}

export type ConvertOptions = {
  markdown?: MarkdownConfig
  mode?: 'full' | 'fragment'
}

class ContentLayerImpl implements ContentLayer {
  private store: ContentStore
  private config: ContentLayerConfig

  constructor(config: ContentLayerConfig) {
    this.config = config
    this.store = new ContentStore(config)
  }

  async getCollection(name: string): Promise<ContentEntry<any>[]> {
    const def = this.config.collections[name]
    if (!def) {
      throw new Error(
        `Collection "${name}" not found. Available: ${Object.keys(this.config.collections).join(
          ', ',
        )}`,
      )
    }
    return this.store.loadCollection(name, def)
  }

  async getEntry(collection: string, slug: string): Promise<ContentEntry<any> | undefined> {
    // The first getEntry call loads the full collection and then serves from cache.
    // Single-entry loading would skip collection-level transforms and validation context.
    await this.getCollection(collection)
    return this.store.getEntry(collection, slug)
  }

  async convert(markdown: string, options?: ConvertOptions): Promise<ConvertResult> {
    const { convert: coreConvert } = await import('@pagesmith/core')
    return coreConvert(markdown, {
      markdown: options?.markdown ?? this.config.markdown,
      mode: options?.mode,
    })
  }

  invalidate(collection: string, slug: string): void {
    this.store.invalidate(collection, slug)
  }

  invalidateCollection(collection: string): void {
    this.store.invalidateCollection(collection)
  }

  invalidateAll(): void {
    this.store.invalidateAll()
  }

  async validate(collection?: string): Promise<ValidationResult[]> {
    const names = collection ? [collection] : Object.keys(this.config.collections)
    const results: ValidationResult[] = []

    for (const name of names) {
      // Ensure loaded
      await this.getCollection(name)

      const issues = this.store.getIssues(name)
      const entries = Array.from(issues.entries()).map(([slug, entryIssues]) => {
        const entry = this.store.getEntry(name, slug)
        return {
          slug,
          filePath: entry?.filePath ?? '',
          issues: entryIssues,
        }
      })

      let errors = 0
      let warnings = 0
      for (const entry of entries) {
        for (const issue of entry.issues) {
          if (issue.severity === 'error') errors++
          else warnings++
        }
      }

      results.push({ collection: name, entries, errors, warnings })
    }

    return results
  }

  async renderDiagrams(options?: { force?: boolean }): Promise<void> {
    const { renderDiagrams: render } = await import('./diagrams/index.js')
    const root = this.config.root ?? process.cwd()
    const diagramConfig = this.config.diagrams
      ? {
          outputDir: this.config.diagrams.outputDir,
          manifestFile: this.config.diagrams.manifestFile,
          useManifest: this.config.diagrams.useManifest,
          sameFolder: this.config.diagrams.sameFolder,
          extensionMap: this.config.diagrams.extensionMap,
          defaultFormat: this.config.diagrams.defaultFormat,
          defaultTheme: this.config.diagrams.defaultTheme,
        }
      : undefined

    // Render diagrams in each markdown collection's directory
    for (const [, def] of Object.entries(this.config.collections)) {
      if (typeof def.loader === 'string' && def.loader !== 'markdown') continue
      if (typeof def.loader === 'object' && !def.loader.extensions.includes('.md')) continue

      const { resolve } = await import('path')
      await render({
        contentDir: resolve(root, def.directory),
        force: options?.force,
        config: diagramConfig,
      })
    }
  }

  getCollectionNames(): string[] {
    return Object.keys(this.config.collections)
  }

  getCollectionDef(name: string): CollectionDef | undefined {
    return this.config.collections[name]
  }
}

/** Create a new content layer from a configuration. */
export function createContentLayer(config: ContentLayerConfig): ContentLayer {
  return new ContentLayerImpl(config)
}
