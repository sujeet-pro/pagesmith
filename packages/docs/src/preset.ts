import { build, preview, startDev } from './site'

export interface DocsPreset {
  build(configPath?: string): Promise<void>
  dev(configPath?: string, options?: { port?: number }): Promise<void>
  preview(options?: { port?: number; configPath?: string }): Promise<void>
}

export function docsPreset(): DocsPreset {
  return {
    build: async (configPath?: string) => build({ configPath }),
    dev: async (configPath?: string, options?: { port?: number }) =>
      startDev({ configPath, port: options?.port }),
    preview: async (options?: { port?: number; configPath?: string }) =>
      preview({ configPath: options?.configPath, port: options?.port }),
  }
}
