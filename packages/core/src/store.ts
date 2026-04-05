/**
 * ContentStore — in-memory cache for loaded collections.
 *
 * Handles file discovery, loading, validation, and caching.
 * Not exported directly — used internally by ContentLayer.
 */

import { availableParallelism } from 'os'
import { resolve } from 'path'
import type { MarkdownConfig } from './schemas/markdown-config'
import type { ZodType } from 'zod'
import { ContentEntry } from './entry'
import { defaultIncludePatterns, resolveLoader } from './loaders'
import type { Loader } from './loaders/types'
import { collectRehypePlugins, collectRemarkPlugins, runPluginValidators } from './plugins'
import type { CollectionDef, RawEntry } from './schemas/collection'
import type { ContentLayerConfig } from './schemas/content-config'
import { discoverFiles } from './utils/glob'
import { toSlug } from './utils/slug'
import { validateSchema, type ValidationIssue } from './validation'
import { builtinMarkdownValidators, runValidators } from './validation/runner'
import type { ContentValidator } from './validation/types'

const MAX_CONCURRENCY = availableParallelism() * 2

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

type CacheEntry = {
  entry: ContentEntry
  issues: ValidationIssue[]
}

export class ContentStore {
  private cache = new Map<string, Map<string, CacheEntry>>()
  private loaded = new Set<string>()
  private loading = new Map<string, Promise<ContentEntry[]>>()
  private config: ContentLayerConfig
  private rootDir: string
  private markdownConfig: MarkdownConfig

  constructor(config: ContentLayerConfig) {
    this.config = config
    this.rootDir = config.root ? resolve(config.root) : process.cwd()
    this.markdownConfig = this.createMarkdownConfig()
  }

  /** Load a collection (if not already loaded) and return entries. */
  async loadCollection<S extends ZodType>(
    name: string,
    def: CollectionDef<S>,
  ): Promise<ContentEntry[]> {
    if (this.loaded.has(name)) {
      const cached = this.cache.get(name)
      return cached ? Array.from(cached.values()).map((c) => c.entry) : []
    }

    const existing = this.loading.get(name)
    if (existing) return existing

    const promise = this._doLoadCollection(name, def)
    this.loading.set(name, promise)
    try {
      return await promise
    } finally {
      this.loading.delete(name)
    }
  }

  private async _doLoadCollection<S extends ZodType>(
    name: string,
    def: CollectionDef<S>,
  ): Promise<ContentEntry[]> {
    const loader = resolveLoader(def.loader)
    const directory = resolve(this.rootDir, def.directory)
    const include = def.include ?? defaultIncludePatterns(loader)

    const files = await discoverFiles({
      directory,
      include,
      exclude: def.exclude,
    })

    const entries = new Map<string, CacheEntry>()
    const strict = this.config.strict ?? false
    const results = await mapWithConcurrency(files, MAX_CONCURRENCY, async (filePath) => {
      try {
        return await this.loadEntry(name, filePath, directory, loader, def)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const loadError = new Error(`[${name}] Failed to load ${filePath}: ${message}`, {
          cause: err,
        })

        if (strict) {
          throw loadError
        }

        console.warn(`[pagesmith] ${loadError.message}`)
        const slug = def.slugify ? def.slugify(filePath, directory) : toSlug(filePath, directory)
        return {
          entry: new ContentEntry(slug, name, filePath, {}, undefined, this.markdownConfig),
          issues: [
            { message: loadError.message, severity: 'error' as const, source: 'schema' as const },
          ],
        }
      }
    })

    for (const result of results) {
      if (result) {
        entries.set(result.entry.slug, result)
      }
    }

    this.cache.set(name, entries)
    this.loaded.add(name)

    return Array.from(entries.values()).map((c) => c.entry)
  }

  /** Load a single entry from a file. */
  private async loadEntry(
    collectionName: string,
    filePath: string,
    directory: string,
    loader: Loader,
    def: CollectionDef<any>,
  ): Promise<CacheEntry | null> {
    const loaded = await loader.load(filePath)
    const slug = def.slugify ? def.slugify(filePath, directory) : toSlug(filePath, directory)

    let raw: RawEntry = {
      data: loaded.data,
      content: loaded.content,
      filePath,
      slug,
    }

    // Apply transform
    if (def.transform) {
      raw = await def.transform(raw)
    }

    // Apply computed fields (clone data to avoid mutating loader output)
    if (def.computed) {
      raw = { ...raw, data: { ...raw.data } }
      for (const [key, fn] of Object.entries(def.computed) as Array<
        [string, (entry: RawEntry) => any]
      >) {
        raw.data[key] = await fn(raw)
      }
    }

    // Apply filter
    if (def.filter && !def.filter(raw)) {
      return null
    }

    // Validate schema once to collect issues and transformed data.
    const { issues, validatedData } = validateSchema(raw.data, def.schema)

    // Custom validation
    if (def.validate) {
      const customError = def.validate(raw)
      if (customError) {
        issues.push({ message: customError, severity: 'error', source: 'custom' })
      }
    }

    // Run content validators on markdown entries
    const isMarkdownEntry = raw.content !== undefined
    if (isMarkdownEntry) {
      const validators = this.resolveValidators(def)
      if (validators.length > 0) {
        const contentIssues = await runValidators(
          {
            filePath,
            slug,
            collection: collectionName,
            rawContent: raw.content,
            data: raw.data,
            getEntry: (col, s) => {
              const cached = this.cache.get(col)?.get(s)
              if (!cached) return undefined
              return { slug: cached.entry.slug, data: cached.entry.data }
            },
          },
          validators,
        )
        issues.push(...contentIssues)
      }
    }

    if (this.config.plugins?.length) {
      const pluginIssues = runPluginValidators(this.config.plugins, {
        data: raw.data,
        content: raw.content,
      })
      for (const message of pluginIssues) {
        issues.push({ message, severity: 'error', source: 'plugin' })
      }
    }

    const entry = new ContentEntry(
      slug,
      collectionName,
      filePath,
      validatedData,
      raw.content,
      this.markdownConfig,
    )

    return { entry, issues }
  }

  /** Get a single entry by slug. */
  getEntry(collection: string, slug: string): ContentEntry | undefined {
    return this.cache.get(collection)?.get(slug)?.entry
  }

  isCollectionLoaded(collection: string): boolean {
    return this.loaded.has(collection)
  }

  /** Get validation issues for a collection. */
  getIssues(collection: string): Map<string, ValidationIssue[]> {
    const result = new Map<string, ValidationIssue[]>()
    const entries = this.cache.get(collection)
    if (!entries) return result
    for (const [slug, cached] of entries) {
      if (cached.issues.length > 0) {
        result.set(slug, cached.issues)
      }
    }
    return result
  }

  /** Invalidate a single entry and reload it without reloading the entire collection. */
  async invalidate(collection: string, slug: string): Promise<void> {
    const def = this.config.collections[collection]
    if (!def) return

    const collectionCache = this.cache.get(collection)
    if (!collectionCache) return

    const existing = collectionCache.get(slug)
    if (!existing) return

    const loader = resolveLoader(def.loader)
    const directory = resolve(this.rootDir, def.directory)

    try {
      const result = await this.loadEntry(
        collection,
        existing.entry.filePath,
        directory,
        loader,
        def,
      )
      if (result) {
        collectionCache.set(slug, result)
      } else {
        // Entry was filtered out after reload
        collectionCache.delete(slug)
      }
    } catch {
      // File may have been deleted; remove from cache
      collectionCache.delete(slug)
    }
  }

  /** Invalidate an entire collection. */
  async invalidateCollection(collection: string): Promise<void> {
    this.cache.delete(collection)
    this.loaded.delete(collection)
  }

  /** Invalidate all collections. */
  invalidateAll(): void {
    this.cache.clear()
    this.loaded.clear()
  }

  /** Get cache statistics for debugging and monitoring. */
  getCacheStats(): { collections: number; entries: Record<string, number>; totalEntries: number } {
    const entries: Record<string, number> = {}
    let totalEntries = 0
    for (const [name, cache] of this.cache) {
      entries[name] = cache.size
      totalEntries += cache.size
    }
    return { collections: this.loaded.size, entries, totalEntries }
  }

  /** Invalidate entries matching a predicate without reloading the entire collection. */
  async invalidateWhere(
    collection: string,
    predicate: (entry: ContentEntry) => boolean,
  ): Promise<number> {
    const collectionCache = this.cache.get(collection)
    if (!collectionCache) return 0

    const def = this.config.collections[collection]
    if (!def) return 0

    const loader = resolveLoader(def.loader)
    const directory = resolve(this.rootDir, def.directory)
    let count = 0

    for (const [slug, cached] of collectionCache) {
      if (!predicate(cached.entry)) continue
      count++
      try {
        const result = await this.loadEntry(
          collection,
          cached.entry.filePath,
          directory,
          loader,
          def,
        )
        if (result) {
          collectionCache.set(slug, result)
        } else {
          collectionCache.delete(slug)
        }
      } catch {
        collectionCache.delete(slug)
      }
    }

    return count
  }

  /** Resolve the list of content validators for a collection. */
  private resolveValidators(def: CollectionDef<any>): ContentValidator[] {
    const builtin = def.disableBuiltinValidators ? [] : builtinMarkdownValidators
    const custom = def.validators ?? []
    return [...builtin, ...custom]
  }

  private createMarkdownConfig(): MarkdownConfig {
    const base = this.config.markdown ?? {}
    const remarkPlugins = [...(base.remarkPlugins ?? [])]
    const rehypePlugins = [...(base.rehypePlugins ?? [])]
    const plugins = this.config.plugins ?? []

    if (plugins.length > 0) {
      remarkPlugins.push(...collectRemarkPlugins(plugins))
      rehypePlugins.push(...collectRehypePlugins(plugins))
    }

    return {
      ...base,
      ...(remarkPlugins.length > 0 ? { remarkPlugins } : {}),
      ...(rehypePlugins.length > 0 ? { rehypePlugins } : {}),
    }
  }
}
