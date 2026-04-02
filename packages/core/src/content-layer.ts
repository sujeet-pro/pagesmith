/**
 * ContentLayer — the main API for working with content collections.
 *
 * Created via createContentLayer(config). Provides methods to:
 * - Load and query collections (getCollection, getEntry)
 * - Convert markdown directly (convert)
 * - Invalidate cache (invalidate, invalidateCollection, invalidateAll)
 * - Validate all entries (validate)
 */

import type { ConvertResult } from './convert'
import type { MarkdownConfig } from './schemas/markdown-config'
import type { ContentEntry } from './entry'
import type { CollectionDef } from './schemas/collection'
import type { ContentLayerConfig } from './schemas/content-config'
import { ContentStore } from './store'
import type { ValidationResult } from './validation'

export interface ContentLayer {
  /** Get all entries in a collection. */
  getCollection(name: string): Promise<ContentEntry<any>[]>

  /** Get a single entry by collection name and slug. */
  getEntry(collection: string, slug: string): Promise<ContentEntry<any> | undefined>

  /** Convert raw markdown to HTML (no collection, no validation). */
  convert(markdown: string, options?: LayerConvertOptions): Promise<ConvertResult>

  /** Invalidate a single entry's cache. */
  invalidate(collection: string, slug: string): void

  /** Invalidate an entire collection's cache. */
  invalidateCollection(collection: string): void

  /** Invalidate all cached data. */
  invalidateAll(): void

  /** Validate all entries in a collection (or all collections). */
  validate(collection?: string): Promise<ValidationResult[]>

  /** Get the names of all configured collections. */
  getCollectionNames(): string[]

  /** Get the definition of a collection. */
  getCollectionDef(name: string): CollectionDef | undefined
}

export type LayerConvertOptions = {
  markdown?: MarkdownConfig
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

  async convert(markdown: string, options?: LayerConvertOptions): Promise<ConvertResult> {
    const { convert: coreConvert } = await import('./convert.js')
    return coreConvert(markdown, {
      markdown: options?.markdown ?? this.config.markdown,
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
