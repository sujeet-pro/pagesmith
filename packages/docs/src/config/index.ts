export { defineDocsConfig, detectGitOrigin, loadDocsConfig, resolveDocsConfig } from './resolve'
export {
  getPackageDir,
  getThemeRoot,
  getThemeRuntimeEntry,
  getThemeStylesEntry,
  readJson5File,
  toTitleCase,
  withBase,
} from './shared'
export { reportConfigIssues, validateConfig } from './validate'
export type {
  ConfigValidationIssue,
  DocsLogLevel,
  DocsBuildOptions,
  DocsDevOptions,
  DocsUserConfig,
  FooterLink,
  GitOriginInfo,
  ResolvedDocsConfig,
} from './types'
