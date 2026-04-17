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

export type SiteValidateOptions = SiteBuildOptions & {
  /** Explicit content directory override (defaults to the preset's content dir). */
  contentDir?: string
  /** Skip content validation. */
  skipContent?: boolean
  /** Skip build-output validation. */
  skipBuild?: boolean
  /** Fetch external URLs to check reachability. */
  checkExternal?: boolean
  /** Enforce webp+avif siblings for raster <picture> fallbacks. */
  requireRasterModernFormats?: boolean
  /** Enforce light+dark <picture> sources. */
  requireThemeVariants?: boolean
  /**
   * Enforce that internal page links are authored as `./relative/path.md`.
   * Absolute `/guide/foo` and bare `./foo` forms become errors when set.
   * Default: off at the site level (presets such as `@pagesmith/docs`
   * turn it on by default).
   */
  requireCanonicalInternalLinks?: boolean
  /** Trailing-slash override for link resolution in build output. */
  trailingSlash?: boolean
  /** Fetch timeout (ms). */
  timeoutMs?: number
  /** Fetch concurrency. */
  concurrency?: number
  /** Print files with no issues during the content report. */
  showClean?: boolean
}

export interface SitePreset {
  build?(options?: SiteBuildOptions): Promise<void>
  dev?(options?: SiteDevOptions): Promise<void>
  preview?(options?: SiteDevOptions): Promise<void>
  init?(argv: string[]): Promise<void>
  mcp?(argv: string[]): Promise<void>
  /**
   * Run the preset's validation pipeline (content + build output). Presets
   * should read their config, resolve content/outDir/basePath, and return a
   * non-zero exit when issues are found. Presets that do not define this
   * method fall back to the generic site validator in the CLI.
   */
  validate?(options?: SiteValidateOptions): Promise<number>
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
