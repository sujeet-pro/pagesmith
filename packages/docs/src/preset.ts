import { build, preview, startDev, type DocsBuildOptions, type DocsDevOptions } from './site'

export interface DocsPreset {
  build(options?: DocsBuildOptions): Promise<void>
  dev(options?: DocsDevOptions): Promise<void>
  preview(options?: DocsDevOptions): Promise<void>
}

export function docsPreset(): DocsPreset {
  return {
    build: async (options?: DocsBuildOptions) => build(options ?? {}),
    dev: async (options?: DocsDevOptions) => startDev(options ?? {}),
    preview: async (options?: DocsDevOptions) => preview(options ?? {}),
  }
}
