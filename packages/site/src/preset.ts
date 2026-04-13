export type SiteLogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose'

export type SiteBuildOptions = {
  configPath?: string
  outDir?: string
  basePath?: string
}

export type SiteDevOptions = SiteBuildOptions & {
  port?: number
  open?: boolean
  logLevel?: SiteLogLevel
}

export interface SitePreset {
  build?(options?: SiteBuildOptions): Promise<void>
  dev?(options?: SiteDevOptions): Promise<void>
  preview?(options?: SiteDevOptions): Promise<void>
  init?(argv: string[]): Promise<void>
  mcp?(argv: string[]): Promise<void>
}

function missingPreset(command: string): never {
  throw new Error(
    `No Pagesmith site preset was selected for "${command}".\n` +
      `  Use --preset <module>, set PAGESMITH_PRESET, or add preset/presets to pagesmith.config.json5.\n` +
      `  If you want the built-in docs workflow, use pagesmith-docs instead of pagesmith-site.`,
  )
}

export function sitePreset(): SitePreset {
  return {
    build: async () => missingPreset('build'),
    dev: async () => missingPreset('dev'),
    preview: async () => missingPreset('preview'),
    init: async () => missingPreset('init'),
    mcp: async () => missingPreset('mcp'),
  }
}

export default sitePreset
