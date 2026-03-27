/**
 * Configuration helpers.
 *
 * defineConfig() and defineCollection() are type-safe identity functions
 * that provide TypeScript inference for collection schemas.
 */

import type { z } from 'zod'
import type { CollectionComputed, CollectionDef, CollectionMap } from './schemas/collection'
import type { Loader, LoaderType } from './loaders/types'
import type { ContentLayerConfig } from './schemas/content-config'

/** Define a content layer configuration with type inference. */
export function defineConfig(config: ContentLayerConfig): ContentLayerConfig {
  return config
}

/** Define a collection with Zod schema type inference. */
export function defineCollection<
  const S extends z.ZodType,
  const TComputed extends CollectionComputed = {},
  const TLoader extends LoaderType | Loader = LoaderType | Loader,
>(
  def: Omit<CollectionDef<S, TComputed, TLoader>, 'computed'> & {
    computed?: TComputed & CollectionComputed
  },
): CollectionDef<S, TComputed, TLoader> {
  return def
}

/** Define a named collection map with strong literal inference. */
export function defineCollections<const TCollections extends CollectionMap>(
  collections: TCollections,
): TCollections {
  return collections
}
