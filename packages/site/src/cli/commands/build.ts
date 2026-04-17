import type { Command } from 'cac'
import { CliError, findPagesmithConfig, withConfigFlag } from '@pagesmith/core/cli-kit'
import { loadSitePreset } from '../load-preset.js'

type BuildOpts = {
  config?: string
  outDir?: string
  basePath?: string
}

export function registerBuildCommand(command: Command, getPresetSpecifier: () => string): Command {
  return withConfigFlag(command)
    .option('--out-dir <path>', 'Output directory (overrides config)')
    .option('--base-path <path>', 'Base URL path prefix (overrides config)')
    .action(async (options: BuildOpts) => {
      const specifier = getPresetSpecifier()
      const preset = await loadSitePreset(specifier)
      if (!preset.build) {
        throw new CliError(`Preset "${specifier}" does not implement build().`)
      }
      const { configPath } = findPagesmithConfig({ explicitPath: options.config })
      await preset.build({
        configPath,
        outDir: options.outDir,
        basePath: options.basePath,
      })
    })
}
