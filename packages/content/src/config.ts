/**
 * Configuration helpers.
 *
 * defineConfig() and defineCollection() are type-safe identity functions
 * that provide TypeScript inference for collection schemas.
 */

import type { z } from 'zod'
import type { CollectionDef } from './schemas/collection'
import type { ContentLayerConfig } from './schemas/config'

/** Define a content layer configuration with type inference. */
export function defineConfig(config: ContentLayerConfig): ContentLayerConfig {
  return config
}

/** Define a collection with Zod schema type inference. */
export function defineCollection<S extends z.ZodType>(def: CollectionDef<S>): CollectionDef<S> {
  return def
}
