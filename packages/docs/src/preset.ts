import type { SiteValidateOptions } from '@pagesmith/site'
import { build, preview, startDev, type DocsBuildOptions, type DocsDevOptions } from './site'
import { validateDocs } from './validate'

export interface DocsPreset {
  build(options?: DocsBuildOptions): Promise<void>
  dev(options?: DocsDevOptions): Promise<void>
  preview(options?: DocsDevOptions): Promise<void>
  validate(options?: SiteValidateOptions): Promise<number>
}

export function docsPreset(): DocsPreset {
  return {
    build: async (options?: DocsBuildOptions) => build(options ?? {}),
    dev: async (options?: DocsDevOptions) => startDev(options ?? {}),
    preview: async (options?: DocsDevOptions) => preview(options ?? {}),
    validate: async (options?: SiteValidateOptions) => {
      const result = await validateDocs({
        configPath: options?.configPath,
        contentDir: options?.contentDir,
        outDir: options?.outDir,
        basePath: options?.basePath,
        trailingSlash: options?.trailingSlash,
        skipContent: options?.skipContent,
        skipBuild: options?.skipBuild,
        checkExternal: options?.checkExternal,
        requireRasterModernFormats: options?.requireRasterModernFormats,
        requireThemeVariants: options?.requireThemeVariants,
        timeoutMs: options?.timeoutMs,
        concurrency: options?.concurrency,
        showClean: options?.showClean,
      })
      console.log(
        `\nSummary: ${result.errors} error(s), ${result.warnings} warning(s) — ${result.passed ? 'PASSED' : 'FAILED'}`,
      )
      return result.passed ? 0 : 1
    },
  }
}
