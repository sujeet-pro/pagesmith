/**
 * Thin wrapper around `cac` so every Pagesmith CLI shares the same flag spelling
 * (`--yes`, `--non-interactive`, `--interactive`, `--config`) and consistent
 * help/version handling.
 *
 * Each command file calls `cli.command(...)` on the returned instance and
 * registers its own options/handler. The returned `runCli(argv)` helper handles
 * help-on-no-command, top-level error formatting, and exit codes.
 */

import cac from 'cac'
import type { CAC, Command } from 'cac'
import { exitCodeFor, formatCliError } from './errors.js'

export type DefineCliOptions = {
  /** Binary name shown in help (e.g. `"pagesmith-docs"`). */
  name: string
  /** Package version printed by `--version`. */
  version: string
  /**
   * Optional descriptive line appended before help. Most CLIs leave this
   * blank because cac's auto-generated help is already verbose.
   */
  description?: string
}

export type RunCliOptions = {
  /** argv slice to parse. Defaults to `process.argv.slice(2)`. */
  argv?: string[]
  /**
   * When `true`, do not call `process.exit`; instead let any thrown error
   * bubble out so callers can handle it (used by tests).
   */
  rethrow?: boolean
}

export type CliInstance = {
  cli: CAC
  /** Register `--config <path>` and the standard interactivity flags on a command. */
  withInteractivityFlags(command: Command): Command
  withConfigFlag(command: Command): Command
  /** Parse argv and dispatch to the registered handlers. */
  run(options?: RunCliOptions): Promise<number>
}

/**
 * Adds the standard `--yes`, `--non-interactive`/`--no-interactive`, and
 * `--interactive` flags to a cac command. Centralizing the spelling here keeps
 * every Pagesmith CLI in lockstep — see `cli-kit/modes.ts` for how they're
 * resolved.
 */
export function withInteractivityFlags(command: Command): Command {
  return command
    .option('-y, --yes', 'Skip prompts and accept detected defaults')
    .option('--non-interactive', 'Force non-interactive mode (alias of --yes for CI)')
    .option('--interactive', 'Force interactive prompts even when env looks non-TTY')
}

export function withConfigFlag(command: Command): Command {
  return command.option(
    '--config <path>',
    'Config file path (default: pagesmith.config.{ts,mts,js,mjs,json5,json})',
  )
}

export function defineCli(options: DefineCliOptions): CliInstance {
  const cli = cac(options.name)
  cli.help()
  cli.version(options.version)

  const run = async (runOptions: RunCliOptions = {}): Promise<number> => {
    const argv = runOptions.argv ?? process.argv.slice(2)

    try {
      const parsed = cli.parse([process.execPath, options.name, ...argv], { run: false })

      // cac already prints --help / --version output before returning. Only
      // dispatch when a command actually matched (`matchedCommandName` is set).
      if (parsed.options['help'] || parsed.options['version']) return 0

      if (!cli.matchedCommandName) {
        cli.outputHelp()
        return 0
      }

      await cli.runMatchedCommand()
      return 0
    } catch (error) {
      if (runOptions.rethrow) throw error
      console.error(formatCliError(error))
      return exitCodeFor(error)
    }
  }

  return {
    cli,
    withInteractivityFlags,
    withConfigFlag,
    run,
  }
}
