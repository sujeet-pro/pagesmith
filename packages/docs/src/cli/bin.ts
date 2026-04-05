#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'
import { createInterface } from 'readline/promises'
import { detectGitOrigin, toTitleCase } from '../config'
import { startDocsMcpServer } from '../mcp/server'
import { build, preview, startDev } from '../site'
import {
  type InitCliArgs,
  parseBuildArgs,
  parseInitArgs,
  parseMcpArgs,
  parseServerArgs,
} from './args'

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
  --log-level <level>                 Log level: silent|error|warn|info|verbose (default: warn)
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

async function ensureDocsConfig(
  configPath?: string,
  opts?: { allowMissing?: boolean },
): Promise<string> {
  const resolved = resolve(configPath ?? 'pagesmith.config.json5')
  if (!existsSync(resolved)) {
    if (opts?.allowMissing) {
      return resolved
    }
    throw new Error(
      `No config file found at ${resolved}\n` +
        `  Run 'pagesmith init' to create one, or use --config to specify a path.`,
    )
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
    title: toTitleCase(name),
    basePath: gitInfo?.basePath ?? '/',
    contentDir: 'docs',
    search: true,
    ai: false,
    starterContent: true,
  }
}

async function promptInteractive(defaults: InitAnswers): Promise<InitAnswers> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const onSigint = () => {
    rl.close()
    console.log('\n  Init cancelled.')
    process.exit(130)
  }
  process.once('SIGINT', onSigint)

  const cleanup = () => {
    process.removeListener('SIGINT', onSigint)
    rl.close()
  }

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
  const title = await ask('Site title', toTitleCase(name))
  const basePath = await ask('Base path', defaults.basePath)
  const contentDir = await ask('Content directory', defaults.contentDir)
  const search = await confirm('Enable search?', defaults.search)
  const ai = await confirm('Install AI integrations?', defaults.ai)
  const starterContent = await confirm('Create starter content?', defaults.starterContent)

  cleanup()
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
  lines.push(`  contentDir: "${answers.contentDir}",`)
  if (gitOrigin) lines.push(`  origin: "${gitOrigin}",`)
  if (answers.search) lines.push('  search: { enabled: true },')
  lines.push('}', '')
  return lines.join('\n')
}

async function runInit(argv: string[]): Promise<void> {
  const args = parseInitArgs(argv)
  if (args._help) {
    printHelp()
    return
  }
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
  if (args._help) {
    printHelp()
    return
  }
  await startDev({
    configPath: await ensureDocsConfig(args.config, { allowMissing: true }),
    port: args.port,
    open: args.open,
    logLevel: args.logLevel,
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runBuild(argv: string[]): Promise<void> {
  const args = parseBuildArgs(argv)
  if (args._help) {
    printHelp()
    return
  }
  await build({
    configPath: await ensureDocsConfig(args.config),
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runPreview(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  if (args._help) {
    printHelp()
    return
  }
  await preview({
    configPath: await ensureDocsConfig(args.config),
    port: args.port,
    open: args.open,
    logLevel: args.logLevel,
    outDir: args.outDir,
    basePath: args.basePath,
  })
}

async function runMcp(argv: string[]): Promise<void> {
  const args = parseMcpArgs(argv)
  if (args._help) {
    printHelp()
    return
  }
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

  throw new Error(`Unknown command: ${command}. Run 'pagesmith --help' for available commands.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
