import type { Command } from 'cac'
import { findPagesmithConfig, withConfigFlag } from '@pagesmith/core/cli-kit'
import { preview } from '../../site.js'
import { parseLogLevel, parsePort } from '../log-level.js'

type PreviewOpts = {
  port?: number | string
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
  logLevel?: string
}

export function registerPreviewCommand(command: Command): Command {
  return withConfigFlag(command)
    .option('-p, --port <number>', 'Server port (default: 4000)')
    .option('--open', 'Open browser on server start')
    .option('--out-dir <path>', 'Output directory (overrides config)')
    .option('--base-path <path>', 'Base URL path prefix (overrides config)')
    .option('--log-level <level>', 'silent|error|warn|info|verbose (default: warn)')
    .action(async (options: PreviewOpts) => {
      const { configPath } = findPagesmithConfig({ explicitPath: options.config })
      await preview({
        configPath,
        port: options.port == null ? undefined : parsePort(options.port),
        open: options.open,
        logLevel: options.logLevel ? parseLogLevel(options.logLevel) : undefined,
        outDir: options.outDir,
        basePath: options.basePath,
      })
    })
}
