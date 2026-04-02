// Re-export public API from focused modules
export {
  defineDocsConfig,
  loadDocsConfig,
  resolveDocsConfig,
  type DocsBuildOptions,
  type DocsDevOptions,
  type DocsUserConfig,
  type ResolvedDocsConfig,
} from './config.js'
export { build } from './build.js'
export { startDev, preview } from './server.js'
