export {
  defineConfig,
  defineDocsConfig,
  detectFirstCommitYear,
  detectGitOrigin,
  loadDocsConfig,
  loadDocsConfigAsync,
  probeHostedOrigin,
  resolveDocsConfig,
  resolveDocsConfigAsync,
  resolveInitOrigin,
} from './resolve'
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
  CopyrightConfig,
  DocsLogLevel,
  DocsBuildOptions,
  DocsDevOptions,
  DocsUserConfig,
  FooterLink,
  FooterLinkGroup,
  FooterLinks,
  GitOriginInfo,
  ResolvedCopyright,
  ResolvedDocsConfig,
} from './types'
