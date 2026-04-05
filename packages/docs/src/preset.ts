import { build, preview, startDev } from './site'

export interface DocsPreset {
  build(configPath?: string): Promise<void>
  dev(options?: { port?: number; configPath?: string }): Promise<void>
  preview(options?: { port?: number; configPath?: string }): Promise<void>
}

export function docsPreset(): DocsPreset {
  return {
    build: async (configPath?: string) => build({ configPath }),
    dev: async (options?: { port?: number; configPath?: string }) =>
      startDev({ configPath: options?.configPath, port: options?.port }),
    preview: async (options?: { port?: number; configPath?: string }) =>
      preview({ configPath: options?.configPath, port: options?.port }),
  }
}
