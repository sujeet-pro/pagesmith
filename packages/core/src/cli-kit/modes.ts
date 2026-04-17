/**
 * Interactive vs non-interactive mode resolution shared by all Pagesmith CLIs.
 *
 * Precedence (highest first):
 *   1. `--yes` / `--non-interactive` flags force non-interactive mode.
 *   2. `--interactive` flag forces interactive mode (errors when no TTY is
 *      attached so the user does not get a silently-hung prompt).
 *   3. Environment auto-detection: `CI`, `PAGESMITH_NON_INTERACTIVE`, and
 *      whether `process.stdin`/`process.stdout` are TTYs.
 *
 * Every Pagesmith CLI honors the same env vars and flag spelling so CI/CD
 * pipelines have one knob to flip.
 */

import { CliError } from './errors.js'

export type InteractivityFlags = {
  yes?: boolean
  nonInteractive?: boolean
  interactive?: boolean
}

export type InteractivityResolution = {
  interactive: boolean
  /** Human-readable reason to print/log when running non-interactively. */
  reason: string
}

export function isNonInteractiveEnv(): boolean {
  if (process.env.CI) return true
  if (process.env.PAGESMITH_NON_INTERACTIVE) return true
  return !(process.stdout.isTTY && process.stdin.isTTY)
}

export function isInteractive(): boolean {
  return !isNonInteractiveEnv()
}

export function resolveInteractive(flags: InteractivityFlags = {}): InteractivityResolution {
  if (flags.yes) return { interactive: false, reason: '--yes' }
  if (flags.nonInteractive) return { interactive: false, reason: '--non-interactive' }
  if (flags.interactive) {
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
      throw new CliError('--interactive requires a TTY for stdin and stdout.', {
        hint:
          'Remove the flag, attach a TTY, or pass --non-interactive / --yes for ' +
          'CI/CD pipelines.',
      })
    }
    return { interactive: true, reason: '--interactive' }
  }

  if (process.env.CI) return { interactive: false, reason: 'CI=1' }
  if (process.env.PAGESMITH_NON_INTERACTIVE) {
    return { interactive: false, reason: 'PAGESMITH_NON_INTERACTIVE=1' }
  }
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return { interactive: false, reason: 'no TTY detected' }
  }
  return { interactive: true, reason: 'TTY' }
}

export type AssertValueOptions = {
  /** Human label for the value (e.g. `"project name"`). */
  label: string
  /** Flag the user can pass on the CLI to satisfy this requirement. */
  flag: string
  /** Optional config key the user can set (e.g. `"name"` or `"cli.core.template"`). */
  configKey?: string
  /** Optional environment variable that can also satisfy the requirement. */
  envVar?: string
}

/**
 * Throws a `CliError` when a required value is missing in non-interactive mode.
 * Passes the value through unchanged in the success path so callers can use it
 * inline: `const name = assertValue(args.name, { ... })`.
 */
export function assertValue<T>(value: T | undefined | null, opts: AssertValueOptions): T {
  if (value !== undefined && value !== null && value !== '') return value

  const sources = [opts.flag]
  if (opts.envVar) sources.push(`$${opts.envVar}`)
  if (opts.configKey) sources.push(`${opts.configKey} in pagesmith.config.{ts,json5,...}`)

  throw new CliError(`${opts.label} is required in non-interactive mode.`, {
    hint: `Pass ${sources.join(' or ')}, or rerun without --non-interactive / --yes.`,
  })
}
