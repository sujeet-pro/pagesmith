/**
 * `@pagesmith/core/cli-kit` — shared CLI plumbing for every Pagesmith CLI
 * (`pagesmith-core`, `pagesmith-site`, `pagesmith-docs`).
 *
 * The kit provides:
 *   - A `cac`-backed parser with shared `--yes` / `--non-interactive` /
 *     `--interactive` / `--config` flag spelling.
 *   - Wrapped `@clack/prompts` helpers with consistent cancel handling.
 *   - Interactivity mode resolution and a strict `assertValue` for required
 *     non-interactive inputs.
 *   - A unified config loader for `pagesmith.config.{ts,mts,js,mjs,json5,json}`.
 *   - Shared error type and formatter.
 *
 * Stability: this surface is consumed internally by `@pagesmith/site` and
 * `@pagesmith/docs`. Third-party CLIs may use it but breaking changes are
 * possible between minor versions.
 */

export { CliError, exitCodeFor, formatCliError } from './errors.js'

export {
  assertValue,
  isInteractive,
  isNonInteractiveEnv,
  resolveInteractive,
  type AssertValueOptions,
  type InteractivityFlags,
  type InteractivityResolution,
} from './modes.js'

export {
  cancel,
  group,
  intro,
  isCancel,
  log,
  note,
  outro,
  promptConfirm,
  promptMultiselect,
  promptSelect,
  promptText,
  spinner,
  tasks,
  type ConfirmPromptOptions,
  type MultiselectPromptOptions,
  type SelectOption,
  type SelectPromptOptions,
  type TextPromptOptions,
} from './prompts.js'

export {
  defineCli,
  withConfigFlag,
  withInteractivityFlags,
  type CliInstance,
  type DefineCliOptions,
  type RunCliOptions,
} from './parse.js'

export {
  findPagesmithConfig,
  loadPagesmithConfig,
  PAGESMITH_CONFIG_BASENAMES,
  readPagesmithConfig,
  type FindConfigOptions,
  type PagesmithConfigFile,
  type PagesmithConfigFormat,
} from './load-config.js'

export { readPackageVersion } from './version.js'
