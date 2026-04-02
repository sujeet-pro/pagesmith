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

/** Singleton loader instances (loaders are stateless). */
const markdownLoader = new MarkdownLoader()
const jsonLoader = new JsonLoader()
const jsoncLoader = new JsoncLoader()
const yamlLoader = new YamlLoader()
const tomlLoader = new TomlLoader()

/** Resolve a loader type string or custom Loader instance. */
export function resolveLoader(loaderOrType: LoaderType | Loader): Loader {
  if (typeof loaderOrType === 'object') return loaderOrType

  switch (loaderOrType) {
    case 'markdown':
      return markdownLoader
    case 'json':
    case 'json5':
      return jsonLoader
    case 'jsonc':
      return jsoncLoader
    case 'yaml':
      return yamlLoader
    case 'toml':
      return tomlLoader
    default:
      throw new Error(`Unknown loader type: ${loaderOrType as string}`)
  }
}

/** Get default include glob patterns for a loader. */
export function defaultIncludePatterns(loader: Loader): string[] {
  return loader.extensions.map((ext) => `**/*${ext}`)
}
