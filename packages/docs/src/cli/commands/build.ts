import type { Command } from 'cac'
import { findPagesmithConfig, withConfigFlag } from '@pagesmith/core/cli-kit'
import { build } from '../../site.js'

type BuildOpts = {
  config?: string
  outDir?: string
  basePath?: string
}

export function registerBuildCommand(command: Command): Command {
  return withConfigFlag(command)
    .option('--out-dir <path>', 'Output directory (overrides config)')
    .option('--base-path <path>', 'Base URL path prefix (overrides config)')
    .action(async (options: BuildOpts) => {
      const { configPath } = findPagesmithConfig({ explicitPath: options.config })
      await build({
        configPath,
        outDir: options.outDir,
        basePath: options.basePath,
      })
    })
}
