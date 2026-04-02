#!/usr/bin/env node

import { build, preview, startDev } from '../site'

type ServerCliArgs = {
  port?: number
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
}

function parseServerArgs(argv: string[]): ServerCliArgs {
  const args: ServerCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--port') {
      const value = argv[++index]
      if (!value) throw new Error('--port requires a number')
      args.port = parseInt(value, 10)
      if (Number.isNaN(args.port)) throw new Error('--port must be a valid number')
      continue
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--open') {
      args.open = true
      continue
    }

    if (arg === '--out-dir') {
      const value = argv[++index]
      if (!value) throw new Error('--out-dir requires a path')
      args.outDir = value
      continue
    }

    if (arg === '--base-path') {
      const value = argv[++index]
      if (!value) throw new Error('--base-path requires a value')
      args.basePath = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return args
}

function printHelp(): void {
  console.log(
    `
pagesmith

Commands:
  dev [options]                       Start a docs dev server
  build [options]                     Build a docs site
  preview [options]                   Preview the built docs site

Options:
  --port <number>                     Server port (dev: 3000, preview: 4173)
  --open                              Open browser on server start
  --out-dir <path>                    Output directory (overrides config)
  --base-path <path>                  Base URL path prefix (overrides config)
  --config <path>                     Config file path
`.trim(),
  )
}

async function ensureDocsConfig(configPath?: string): Promise<string> {
  const { existsSync } = await import('fs')
  const { resolve } = await import('path')

  const resolved = resolve(configPath ?? 'pagesmith.config.json5')
  if (!existsSync(resolved)) {
    throw new Error(`No pagesmith.config.json5 file found at ${resolved}`)
  }

  return resolved
}

async function runDev(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  await startDev({
    configPath: await ensureDocsConfig(args.config),
    port: args.port,
    open: args.open,
  })
}

async function runBuild(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  await build({
    configPath: await ensureDocsConfig(args.config),
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runPreview(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  await preview({
    configPath: await ensureDocsConfig(args.config),
    port: args.port,
  })
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'dev') {
    await runDev(rest)
    return
  }

  if (command === 'build') {
    await runBuild(rest)
    return
  }

  if (command === 'preview') {
    await runPreview(rest)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
