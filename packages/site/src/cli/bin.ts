#!/usr/bin/env node

import { defineCli, readPackageVersion } from '@pagesmith/core/cli-kit'
import { registerBuildCommand } from './commands/build.js'
import { registerDevCommand } from './commands/dev.js'
import { registerInitCommand } from './commands/init.js'
import { registerMcpCommand } from './commands/mcp.js'
import { registerPreviewCommand } from './commands/preview.js'
import { registerValidateCommand } from './commands/validate.js'
import { defaultPresetSpecifier, extractPresetArgv, resolvePresetSpecifier } from './load-preset.js'

const version = readPackageVersion(import.meta.dirname)

// Strip --preset from argv before cac parses, so it does not error on the flag.
const rawArgv = process.argv.slice(2)
const { specifier: explicitPreset, rest: strippedArgv } = extractPresetArgv(rawArgv)

function readConfigFlag(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!
    if (arg === '--config') return argv[index + 1]
    if (arg.startsWith('--config=')) return arg.slice('--config='.length)
  }
  return undefined
}

const presetSpecifier = resolvePresetSpecifier(explicitPreset, readConfigFlag(strippedArgv))
const getPresetSpecifier = () => presetSpecifier

const cliInstance = defineCli({
  name: 'pagesmith-site',
  version,
  description: '@pagesmith/site CLI — preset-driven dev/build/preview/validate/init/mcp',
})
const { cli } = cliInstance

cli.usage(
  `<command> [options]

Preset: ${presetSpecifier} (override with --preset, PAGESMITH_PRESET, or config preset/presets)
Default preset: ${defaultPresetSpecifier(readConfigFlag(strippedArgv))}

Use \`pagesmith\` as a shorter alias for \`pagesmith-site\`.`,
)

cli.option('--preset <module>', 'Preset module (e.g. @pagesmith/docs/preset)')

registerDevCommand(cli.command('dev', 'Start dev server (preset-defined)'), getPresetSpecifier)
registerBuildCommand(cli.command('build', 'Production build (preset-defined)'), getPresetSpecifier)
registerPreviewCommand(
  cli.command('preview', 'Preview build output (preset-defined)'),
  getPresetSpecifier,
)
registerValidateCommand(
  cli.command('validate', 'Validate content and/or build output'),
  getPresetSpecifier,
)
registerInitCommand(cli.command('init', 'Preset-defined init flow'), getPresetSpecifier, () =>
  strippedArgv.slice(1),
)
registerMcpCommand(cli.command('mcp', 'Preset-defined MCP server'), getPresetSpecifier, () =>
  strippedArgv.slice(1),
)

const exitCode = await cliInstance.run({ argv: strippedArgv })
if (exitCode !== 0) process.exit(exitCode)
