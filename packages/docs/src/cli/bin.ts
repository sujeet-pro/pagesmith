#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { build, preview, startDev } from '../site'

type ServerCliArgs = {
  port?: number
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
}

type InitCliArgs = {
  ai?: boolean
  config?: string
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

function parseInitArgs(argv: string[]): InitCliArgs {
  const args: InitCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--ai') {
      args.ai = true
      continue
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return args
}

function getVersion(): string {
  const pkgPath = resolve(import.meta.dirname, '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  return pkg.version ?? '0.0.0'
}

function printHelp(): void {
  console.log(
    `
pagesmith

Commands:
  init [options]                       Initialize a docs project
  dev [options]                        Start a docs dev server
  build [options]                      Build a docs site
  preview [options]                    Preview the built docs site

Init options:
  --ai                                Install AI integrations (skills, guidelines)
  --config <path>                     Config file path

Server options:
  --port <number>                     Server port (dev: 3000, preview: 4173)
  --open                              Open browser on server start
  --out-dir <path>                    Output directory (overrides config)
  --base-path <path>                  Base URL path prefix (overrides config)
  --config <path>                     Config file path

General:
  -v, --version                       Print version
  -h, --help                          Print help
`.trim(),
  )
}

async function ensureDocsConfig(configPath?: string): Promise<string> {
  const resolved = resolve(configPath ?? 'pagesmith.config.json5')
  if (!existsSync(resolved)) {
    throw new Error(`No pagesmith.config.json5 file found at ${resolved}`)
  }

  return resolved
}

async function runInit(argv: string[]): Promise<void> {
  const args = parseInitArgs(argv)
  const configPath = resolve(args.config ?? 'pagesmith.config.json5')

  // Create pagesmith.config.json5 if it doesn't exist
  if (!existsSync(configPath)) {
    const pkgPath = resolve('package.json')
    let projectName = 'My Docs'
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name) projectName = pkg.name
      } catch {
        // ignore parse errors
      }
    }

    writeFileSync(
      configPath,
      [
        '{',
        `  name: '${projectName}',`,
        `  title: '${projectName}',`,
        `  description: 'Documentation for ${projectName}',`,
        "  contentDir: './content',",
        "  outDir: './dist',",
        '  search: { enabled: true },',
        '}',
        '',
      ].join('\n'),
    )
    console.log(`Created ${configPath}`)
  } else {
    console.log(`Config already exists: ${configPath}`)
  }

  // Create content directory structure
  const contentDir = resolve('content')
  const dirs = [
    contentDir,
    resolve(contentDir, 'guide'),
    resolve(contentDir, 'guide', 'getting-started'),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  // Home page
  const homePath = resolve(contentDir, 'README.md')
  if (!existsSync(homePath)) {
    writeFileSync(
      homePath,
      [
        '---',
        'layout: DocHome',
        'title: Documentation',
        'tagline: Welcome to the documentation',
        'description: Project documentation',
        'actions:',
        '  - text: Get Started',
        '    link: /guide/getting-started',
        '    theme: brand',
        '---',
        '',
        'Welcome to the documentation.',
        '',
      ].join('\n'),
    )
    console.log('Created content/README.md')
  }

  // Guide meta
  const guideMetaPath = resolve(contentDir, 'guide', 'meta.json5')
  if (!existsSync(guideMetaPath)) {
    writeFileSync(
      guideMetaPath,
      [
        '{',
        "  displayName: 'Guide',",
        "  orderBy: 'manual',",
        "  items: ['getting-started'],",
        '}',
        '',
      ].join('\n'),
    )
    console.log('Created content/guide/meta.json5')
  }

  // Getting started page
  const gettingStartedPath = resolve(contentDir, 'guide', 'getting-started', 'README.md')
  if (!existsSync(gettingStartedPath)) {
    writeFileSync(
      gettingStartedPath,
      [
        '---',
        'title: Getting Started',
        'description: Learn the basics.',
        '---',
        '',
        '# Getting Started',
        '',
        'Start here.',
        '',
      ].join('\n'),
    )
    console.log('Created content/guide/getting-started/README.md')
  }

  // AI integrations
  if (args.ai) {
    const { installAiArtifacts } = await import('@pagesmith/core/ai')
    const results = installAiArtifacts({
      assistants: 'all',
      scope: 'project',
      profile: 'docs',
    })
    for (const result of results) {
      console.log(`${result.status}: ${result.label} → ${result.path}`)
    }
  }

  console.log('\nDone! Next steps:')
  console.log('  npx pagesmith dev')
  if (!args.ai) {
    console.log('  npx pagesmith init --ai  # Optional: install AI integrations')
  }
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
    open: args.open,
  })
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === '--version' || command === '-v') {
    console.log(getVersion())
    return
  }

  if (command === 'init') {
    await runInit(rest)
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
