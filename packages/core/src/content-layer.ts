/**
 * ContentLayer — the main API for working with content collections.
 *
 * Created via createContentLayer(config). Provides methods to:
 * - Load and query collections (getCollection, getEntry)
 * - Convert markdown directly (convert)
 * - Invalidate cache (invalidate, invalidateCollection, invalidateAll)
 * - Validate all entries (validate)
 */

import { watch as fsWatch, type FSWatcher } from 'fs'
import { resolve as pathResolve } from 'path'

import { convert as coreConvert } from './convert'
import type { ConvertResult } from './convert'
import type { MarkdownConfig } from './schemas/markdown-config'
import type { ContentEntry } from './entry'
import type { CollectionDef, InferCollectionData } from './schemas/collection'
import type { ContentLayerConfig } from './schemas/content-config'
import { ContentStore } from './store'
import type { ValidationResult } from './validation'

export type WatchEvent = {
  collection: string
  event: string
  filename: string | null
}

export type WatchHandle = {
  close(): void
}

export type WatchCallback = (event: WatchEvent) => void

/** Typed content layer that preserves collection schema types. */
export type TypedContentLayer<T extends Record<string, CollectionDef>> = ContentLayer & {
  getCollection<K extends keyof T & string>(
    name: K,
  ): Promise<ContentEntry<InferCollectionData<T[K]>>[]>
  getEntry<K extends keyof T & string>(
    collection: K,
    slug: string,
  ): Promise<ContentEntry<InferCollectionData<T[K]>> | undefined>
}

export interface ContentLayer {
  /** Get all entries in a collection. */
  getCollection(name: string): Promise<ContentEntry[]>

  /** Get a single entry by collection name and slug. */
  getEntry(collection: string, slug: string): Promise<ContentEntry | undefined>

  /** Convert raw markdown to HTML (no collection, no validation). */
  convert(markdown: string, options?: LayerConvertOptions): Promise<ConvertResult>

  /** Invalidate a single entry's cache. */
  invalidate(collection: string, slug: string): Promise<void>

  /** Invalidate an entire collection's cache. */
  invalidateCollection(collection: string): Promise<void>

  /** Invalidate all cached data. */
  invalidateAll(): void

  /** Validate all entries in a collection (or all collections). */
  validate(collection?: string): Promise<ValidationResult[]>

  /** Get the names of all configured collections. */
  getCollectionNames(): string[]

  /** Get the definition of a collection. */
  getCollectionDef(name: string): CollectionDef | undefined

  /** Get all collection definitions. */
  getCollections(): Record<string, CollectionDef>

  /** Invalidate entries in a collection that match a predicate. Returns count of invalidated entries. */
  invalidateWhere(collection: string, predicate: (entry: ContentEntry) => boolean): Promise<number>

  /** Watch collection directories for changes. Returns a handle to stop watching. */
  watch(callback: WatchCallback): WatchHandle

  /** Get cache statistics for debugging and monitoring. */
  getCacheStats(): { collections: number; entries: Record<string, number>; totalEntries: number }
}

export type LayerConvertOptions = {
  markdown?: MarkdownConfig
  /**
   * Absolute or project-relative source path for the markdown being converted.
   * Provide this when the markdown references local images so `convert()` can
   * resolve refs from the markdown file and fill intrinsic dimensions.
   */
  sourcePath?: string
  /**
   * Allowed root directory for relative local image refs. Defaults to the
   * markdown file's own directory when `sourcePath` is provided. Set this when
   * you want `layer.convert()` to allow refs that move outside the file
   * directory but still stay inside a broader content root, matching
   * `entry.render()`.
   */
  assetRoot?: string
}

class ContentLayerImpl implements ContentLayer {
  private store: ContentStore
  private config: ContentLayerConfig

  constructor(config: ContentLayerConfig) {
    this.config = config
    this.store = new ContentStore(config)
  }

  async getCollection(name: string): Promise<ContentEntry[]> {
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

  async getEntry(collection: string, slug: string): Promise<ContentEntry | undefined> {
    const cached = this.store.getEntry(collection, slug)
    if (cached) return cached

    // If the collection was already loaded and this slug wasn't found, short-circuit.
    if (this.store.isCollectionLoaded(collection)) return undefined

    // The first getEntry call loads the full collection and then serves from cache.
    // Single-entry loading would skip collection-level transforms and validation context.
    await this.getCollection(collection)
    return this.store.getEntry(collection, slug)
  }

  async convert(markdown: string, options?: LayerConvertOptions): Promise<ConvertResult> {
    return coreConvert(markdown, {
      markdown: options?.markdown ?? this.config.markdown,
      sourcePath: options?.sourcePath,
      assetRoot: options?.assetRoot,
    })
  }

  async invalidate(collection: string, slug: string): Promise<void> {
    await this.store.invalidate(collection, slug)
  }

  async invalidateCollection(collection: string): Promise<void> {
    await this.store.invalidateCollection(collection)
  }

  invalidateAll(): void {
    this.store.invalidateAll()
  }

  async invalidateWhere(
    collection: string,
    predicate: (entry: ContentEntry) => boolean,
  ): Promise<number> {
    return this.store.invalidateWhere(collection, predicate)
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

  getCollections(): Record<string, CollectionDef> {
    return { ...this.config.collections }
  }

  watch(callback: WatchCallback): WatchHandle {
    const watchers: FSWatcher[] = []
    const root = this.config.root ?? process.cwd()
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    for (const [name, def] of Object.entries(this.config.collections)) {
      const dir = pathResolve(root, def.directory)
      try {
        const watcher = fsWatch(dir, { recursive: true }, (event, filename) => {
          // Debounce: coalesce rapid changes per collection within 100ms
          const existing = timers.get(name)
          if (existing) clearTimeout(existing)
          timers.set(
            name,
            setTimeout(() => {
              timers.delete(name)
              void this.store.invalidateCollection(name)
              callback({ collection: name, event, filename })
            }, 100),
          )
        })
        watcher.on('error', (err) => {
          console.warn(`Content watcher error for "${name}":`, err.message)
        })
        watchers.push(watcher)
      } catch {
        // Directory may not exist yet — skip silently
      }
    }

    return {
      close() {
        for (const w of watchers) w.close()
        for (const t of timers.values()) clearTimeout(t)
        timers.clear()
      },
    }
  }

  getCacheStats() {
    return this.store.getCacheStats()
  }
}

/** Create a new content layer from a configuration. */
export function createContentLayer<T extends Record<string, CollectionDef>>(
  config: ContentLayerConfig & { collections: T },
): TypedContentLayer<T>
export function createContentLayer(config: ContentLayerConfig): ContentLayer
export function createContentLayer(config: ContentLayerConfig): ContentLayer {
  return new ContentLayerImpl(config)
}
