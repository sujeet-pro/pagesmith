/**
 * Loader registry — resolves loader type strings to Loader instances.
 */

export { JsonLoader } from './json'
export { JsoncLoader } from './jsonc'
export { LoaderError } from './errors'
export { MarkdownLoader } from './markdown'
export { TomlLoader } from './toml'
export type { Loader, LoaderResult, LoaderType } from './types'
export { YamlLoader } from './yaml'

import { JsonLoader } from './json'
import { JsoncLoader } from './jsonc'
import { MarkdownLoader } from './markdown'
import { TomlLoader } from './toml'
import type { Loader, LoaderType } from './types'
import { YamlLoader } from './yaml'

/** Resolve a loader type string or custom Loader instance. */
export function resolveLoader(loaderOrType: LoaderType | Loader): Loader {
  if (typeof loaderOrType === 'object') return loaderOrType

  switch (loaderOrType) {
    case 'markdown':
      return new MarkdownLoader()
    case 'json':
    case 'json5':
      return new JsonLoader()
    case 'jsonc':
      return new JsoncLoader()
    case 'yaml':
      return new YamlLoader()
    case 'toml':
      return new TomlLoader()
    default:
      throw new Error(`Unknown loader type: ${loaderOrType as string}`)
  }
}

/** Get default include glob patterns for a loader. */
export function defaultIncludePatterns(loader: Loader): string[] {
  return loader.extensions.map((ext) => `**/*${ext}`)
}
