/**
 * Configuration resolver.
 *
 * Provides `defineConfig` for type-safe user config and `resolveConfig`
 * to merge user config with defaults and resolve all paths to absolute.
 */

import { resolve, } from 'path'
import { DEFAULTS, } from './defaults'

/** User-provided Pagesmith configuration (all fields optional). */
export type PagesmithConfig = {
  rootDir?: string
  contentDir?: string
  layoutsDir?: string | string[]
  stylesDir?: string
  publicDir?: string
  outDir?: string
  css?: {
    entries?: string[]
    minify?: boolean
  }
  runtime?: {
    entries?: string[]
    target?: 'browser'
    minify?: boolean
  }
  generators?: {
    tagListingLayout?: string
    tagIndexLayout?: string
    notFoundLayout?: string
  }
  parallel?: boolean
}

/** Fully resolved configuration with absolute paths. */
export type ResolvedConfig = {
  rootDir: string
  contentDir: string
  layoutsDirs: string[]
  stylesDir: string
  publicDir: string
  outDir: string
  css: {
    entries: string[]
    minify: boolean
  }
  runtime: {
    entries: string[]
    target: 'browser'
    minify: boolean
  }
  generators: {
    tagListingLayout: string
    tagIndexLayout: string
    notFoundLayout: string
  }
  parallel: boolean
}

/** Type-safe config helper. Returns the config as-is for use with `resolveConfig`. */
export function defineConfig(config: PagesmithConfig,): PagesmithConfig {
  return config
}

/** Merge user config with defaults and resolve all paths to absolute. */
export function resolveConfig(userConfig: PagesmithConfig = {},): ResolvedConfig {
  const rootDir = resolve(userConfig.rootDir ?? process.cwd(),)
  const abs = (p: string,) => resolve(rootDir, p,)

  const layoutsDirs = Array.isArray(userConfig.layoutsDir,)
    ? userConfig.layoutsDir.map(abs,)
    : [abs(userConfig.layoutsDir ?? DEFAULTS.layoutsDir,),]

  return {
    rootDir,
    contentDir: abs(userConfig.contentDir ?? DEFAULTS.contentDir,),
    layoutsDirs,
    stylesDir: abs(userConfig.stylesDir ?? DEFAULTS.stylesDir,),
    publicDir: abs(userConfig.publicDir ?? DEFAULTS.publicDir,),
    outDir: abs(userConfig.outDir ?? DEFAULTS.outDir,),
    css: {
      entries: (userConfig.css?.entries ?? DEFAULTS.css.entries).map(abs,),
      minify: userConfig.css?.minify ?? DEFAULTS.css.minify,
    },
    runtime: {
      entries: (userConfig.runtime?.entries ?? DEFAULTS.runtime.entries).map(abs,),
      target: userConfig.runtime?.target ?? DEFAULTS.runtime.target,
      minify: userConfig.runtime?.minify ?? DEFAULTS.runtime.minify,
    },
    generators: {
      tagListingLayout:
        userConfig.generators?.tagListingLayout ?? DEFAULTS.generators.tagListingLayout,
      tagIndexLayout:
        userConfig.generators?.tagIndexLayout ?? DEFAULTS.generators.tagIndexLayout,
      notFoundLayout:
        userConfig.generators?.notFoundLayout ?? DEFAULTS.generators.notFoundLayout,
    },
    parallel: userConfig.parallel ?? DEFAULTS.parallel,
  }
}
