#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'
import { createInterface } from 'readline/promises'
import { detectGitOrigin } from '../config'
import { startDocsMcpServer } from '../mcp/server'
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
  yes?: boolean
  noLlms?: boolean
}

type McpCliArgs = {
  config?: string
  root?: string
  stdio?: boolean
}

function parseServerArgs(argv: string[]): ServerCliArgs {
  const args: ServerCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--port' || arg === '-p') {
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

    if (arg === '--yes' || arg === '-y') {
      args.yes = true
      continue
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--no-llms') {
      args.noLlms = true
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return args
}

function parseMcpArgs(argv: string[]): McpCliArgs {
  const args: McpCliArgs = { stdio: true }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--root') {
      const value = argv[++index]
      if (!value) throw new Error('--root requires a path')
      args.root = value
      continue
    }

    if (arg === '--stdio') {
      args.stdio = true
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
  init [options]                       Initialize a docs project (interactive)
  dev [options]                        Start a docs dev server
  build [options]                      Build a docs site
  preview [options]                    Preview the built docs site
  mcp [options]                        Start stdio MCP server for docs tooling

Init options:
  -y, --yes                           Skip prompts, use defaults
  --ai                                Install AI integrations (skills, guidelines)
  --no-llms                           Skip llms.txt / llms-full.txt generation during AI install
  --config <path>                     Config file path

Server options:
  -p, --port <number>                 Server port (dev: 3000, preview: 4000)
  --open                              Open browser on server start
  --out-dir <path>                    Output directory (overrides config)
  --base-path <path>                  Base URL path prefix (overrides config)
  --config <path>                     Config file path

MCP options:
  --stdio                             Use stdio transport (default)
  --config <path>                     Config file path used by docs_* tools
  --root <path>                       Project root to resolve config/content paths

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

// ---------------------------------------------------------------------------
// Interactive prompts (Node built-in readline/promises)
// ---------------------------------------------------------------------------

type InitAnswers = {
  name: string
  title: string
  basePath: string
  contentDir: string
  search: boolean
  ai: boolean
  starterContent: boolean
}

function titleize(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function readPackageName(projectDir: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(resolve(projectDir, 'package.json'), 'utf-8'))
    const raw: string | undefined = pkg.name
    return raw?.replace(/^@[^/]+\//, '') // strip npm scope
  } catch {
    return undefined
  }
}

function detectDefaults(projectDir: string): InitAnswers {
  const gitInfo = detectGitOrigin(projectDir)
  const pkgName = readPackageName(projectDir)
  const name = gitInfo?.repoName ?? pkgName ?? basename(projectDir)

  return {
    name,
    title: titleize(name),
    basePath: gitInfo?.basePath ?? '/',
    contentDir: 'docs',
    search: true,
    ai: false,
    starterContent: true,
  }
}

async function promptInteractive(defaults: InitAnswers): Promise<InitAnswers> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const ask = async (label: string, fallback: string): Promise<string> => {
    const answer = await rl.question(`  ${label} (${fallback}): `)
    return answer.trim() || fallback
  }

  const confirm = async (label: string, defaultYes: boolean): Promise<boolean> => {
    const hint = defaultYes ? 'Y/n' : 'y/N'
    const answer = await rl.question(`  ${label} (${hint}): `)
    const trimmed = answer.trim().toLowerCase()
    if (!trimmed) return defaultYes
    return trimmed.startsWith('y')
  }

  console.log(`\n  Pagesmith v${getVersion()}\n`)

  const name = await ask('Project name', defaults.name)
  const title = await ask('Site title', titleize(name))
  const basePath = await ask('Base path', defaults.basePath)
  const contentDir = await ask('Content directory', defaults.contentDir)
  const search = await confirm('Enable search?', defaults.search)
  const ai = await confirm('Install AI integrations?', defaults.ai)
  const starterContent = await confirm('Create starter content?', defaults.starterContent)

  rl.close()
  console.log()

  return { name, title, basePath, contentDir, search, ai, starterContent }
}

// ---------------------------------------------------------------------------
// Init logic
// ---------------------------------------------------------------------------

function buildConfigContent(answers: InitAnswers, gitOrigin?: string): string {
  const lines: string[] = ['{']
  lines.push(`  name: "${answers.name}",`)
  lines.push(`  title: "${answers.title}",`)
  lines.push(`  basePath: "${answers.basePath}",`)
  if (gitOrigin) lines.push(`  origin: "${gitOrigin}",`)
  if (answers.search) lines.push('  search: { enabled: true },')
  lines.push('}', '')
  return lines.join('\n')
}

async function runInit(argv: string[]): Promise<void> {
  const args = parseInitArgs(argv)
  const projectDir = resolve('.')
  const configPath = resolve(args.config ?? 'pagesmith.config.json5')

  const defaults = detectDefaults(projectDir)

  // --ai flag pre-selects AI integrations even in interactive mode
  if (args.ai) defaults.ai = true

  // Resolve answers: interactive or accept defaults
  const answers = args.yes ? defaults : await promptInteractive(defaults)

  const created: string[] = []

  // 1. Create config file
  if (!existsSync(configPath)) {
    const gitInfo = detectGitOrigin(projectDir)
    const configContent = buildConfigContent(answers, gitInfo?.origin)
    writeFileSync(configPath, configContent)
    created.push(args.config ?? 'pagesmith.config.json5')
  } else {
    console.log(`  Config already exists: ${configPath}`)
  }

  // 2. Create content directory structure
  const contentDir = resolve(answers.contentDir)
  const dirs = [
    contentDir,
    resolve(contentDir, 'guide'),
    resolve(contentDir, 'guide', 'getting-started'),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  // 3. Starter content
  if (answers.starterContent) {
    const homePath = resolve(contentDir, 'README.md')
    if (!existsSync(homePath)) {
      writeFileSync(
        homePath,
        [
          '---',
          `title: ${answers.title}`,
          `tagline: Welcome to ${answers.title}`,
          `description: ${answers.title} documentation`,
          'actions:',
          '  - text: Get Started',
          '    link: /guide/getting-started',
          '    theme: brand',
          '---',
          '',
        ].join('\n'),
      )
      created.push(`${answers.contentDir}/README.md`)
    }

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
      created.push(`${answers.contentDir}/guide/getting-started/README.md`)
    }
  }

  // 4. AI integrations
  if (answers.ai) {
    const { installAiArtifacts } = await import('@pagesmith/core/ai')
    const results = installAiArtifacts({
      assistants: 'all',
      scope: 'project',
      profile: 'docs',
      includeLlms: !args.noLlms,
    })
    for (const result of results) {
      created.push(result.path)
      console.log(`  ${result.status}: ${result.label} → ${result.path}`)
    }
  }

  // 5. Summary
  if (created.length > 0) {
    console.log('  Created:')
    for (const file of created) {
      console.log(`    ${file}`)
    }
  }

  console.log('\n  Done! Next steps:')
  console.log(`    npx pagesmith dev`)
  if (!answers.ai) {
    console.log('    npx pagesmith init --ai  # Optional: install AI integrations')
  }
  console.log()
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

async function runMcp(argv: string[]): Promise<void> {
  const args = parseMcpArgs(argv)
  await startDocsMcpServer({
    configPath: args.config,
    rootDir: args.root,
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

  if (command === 'mcp') {
    await runMcp(rest)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
