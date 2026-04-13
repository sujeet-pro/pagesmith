#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { parseBuildArgs, parseServerArgs } from './args.js'
import {
  defaultPresetSpecifier,
  extractPresetArgv,
  loadSitePreset,
  resolvePresetSpecifier,
} from './load-preset.js'

function getVersion(): string {
  const pkgPath = resolve(import.meta.dirname, '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
  return pkg.version ?? '0.0.0'
}

function printHelp(presetHint: string): void {
  console.log(
    `
pagesmith-site (@pagesmith/site)

Preset: ${presetHint} (override with --preset, PAGESMITH_PRESET, or config preset/presets)

Commands:
  init [options]                       Preset-defined init flow
  dev [options]                        Start dev server (preset-defined)
  build [options]                      Production build (preset-defined)
  preview [options]                    Preview build output (preset-defined)
  mcp [options]                        Preset-defined MCP server

Server / build options:
  -p, --port <number>                 Server port (dev / preview)
  --open                              Open browser (dev / preview)
  --out-dir <path>                    Output directory override
  --base-path <path>                  Base URL path override
  --log-level <level>                 silent|error|warn|info|verbose (dev / preview; default: warn)
  --config <path>                     Config file path

General:
  --preset <module>                   Preset module (e.g. @pagesmith/docs/preset)
  -v, --version                       Print version
  -h, --help                          Print help
`.trim(),
  )
}

function readConfigFlag(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!
    if (arg === '--config') {
      return argv[index + 1]
    }
    if (arg.startsWith('--config=')) {
      return arg.slice('--config='.length)
    }
  }
  return undefined
}

async function resolveConfigPath(
  configPath: string | undefined,
  allowMissing: boolean,
): Promise<string | undefined> {
  const resolved = resolve(configPath ?? 'pagesmith.config.json5')
  if (!existsSync(resolved)) {
    if (allowMissing) return undefined
    throw new Error(
      `No config file found at ${resolved}\n` +
        `  Use --config to specify a path, or add a config file for your preset.`,
    )
  }
  return resolved
}

async function runDev(presetSpecifier: string, argv: string[]): Promise<void> {
  const preset = await loadSitePreset(presetSpecifier)
  if (!preset.dev) {
    throw new Error(`Preset "${presetSpecifier}" does not implement dev().`)
  }
  const args = parseServerArgs(argv)
  if (args._help) {
    printHelp(presetSpecifier)
    return
  }
  const configPath = await resolveConfigPath(args.config, true)
  await preset.dev({
    configPath,
    port: args.port,
    open: args.open,
    logLevel: args.logLevel,
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runBuild(presetSpecifier: string, argv: string[]): Promise<void> {
  const preset = await loadSitePreset(presetSpecifier)
  if (!preset.build) {
    throw new Error(`Preset "${presetSpecifier}" does not implement build().`)
  }
  const args = parseBuildArgs(argv)
  if (args._help) {
    printHelp(presetSpecifier)
    return
  }
  const configPath = await resolveConfigPath(args.config, true)
  await preset.build({
    configPath,
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runPreview(presetSpecifier: string, argv: string[]): Promise<void> {
  const preset = await loadSitePreset(presetSpecifier)
  if (!preset.preview) {
    throw new Error(`Preset "${presetSpecifier}" does not implement preview().`)
  }
  const args = parseServerArgs(argv)
  if (args._help) {
    printHelp(presetSpecifier)
    return
  }
  const configPath = await resolveConfigPath(args.config, true)
  await preset.preview({
    configPath,
    port: args.port,
    open: args.open,
    logLevel: args.logLevel,
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function main(): Promise<void> {
  const rawArgv = process.argv.slice(2)
  const { specifier: explicitPreset, rest: strippedArgv } = extractPresetArgv(rawArgv)
  const [command, ...commandArgv] = strippedArgv
  const presetSpecifier = resolvePresetSpecifier(explicitPreset, readConfigFlag(commandArgv))

  if (!command || command === '--help' || command === '-h') {
    printHelp(presetSpecifier)
    return
  }

  if (command === '--version' || command === '-v') {
    console.log(getVersion())
    return
  }

  if (command === 'dev') {
    await runDev(presetSpecifier, commandArgv)
    return
  }

  if (command === 'build') {
    await runBuild(presetSpecifier, commandArgv)
    return
  }

  if (command === 'preview') {
    await runPreview(presetSpecifier, commandArgv)
    return
  }

  const preset = await loadSitePreset(presetSpecifier)
  if (command === 'init' && preset.init) {
    await preset.init(commandArgv)
    return
  }
  if (command === 'init') {
    throw new Error(
      `Preset "${presetSpecifier}" does not implement init().\n` +
        `  Use a preset that defines init, or use pagesmith-docs for the built-in docs workflow.`,
    )
  }
  if (command === 'mcp' && preset.mcp) {
    await preset.mcp(commandArgv)
    return
  }
  if (command === 'mcp') {
    throw new Error(
      `Preset "${presetSpecifier}" does not implement mcp().\n` +
        `  Use a preset that defines mcp, or use pagesmith-docs for the built-in docs workflow.`,
    )
  }

  throw new Error(
    `Unknown command: ${command}. Run 'pagesmith-site --help' for available commands.\n` +
      `  (Preset is ${presetSpecifier}; default is ${defaultPresetSpecifier(readConfigFlag(commandArgv))}.)`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
