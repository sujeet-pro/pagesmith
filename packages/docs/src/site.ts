// Re-export public API from focused modules
export {
  defineConfig,
  defineDocsConfig,
  loadDocsConfig,
  loadDocsConfigAsync,
  reportConfigIssues,
  resolveDocsConfig,
  resolveDocsConfigAsync,
  validateConfig,
  type ConfigValidationIssue,
  type DocsBuildOptions,
  type DocsDevOptions,
  type DocsUserConfig,
  type ResolvedDocsConfig,
} from './config.js'
export { build, rebuildContent } from './build.js'
export { startDev, preview } from './server.js'
