#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'
import { createInterface } from 'readline/promises'
import { detectFirstCommitYear, detectGitOrigin, resolveInitOrigin, toTitleCase } from '../config'
import { startDocsMcpServer } from '../mcp/server'
import { build, preview, startDev } from '../site'
import {
  applyExistingConfigDefaults,
  type InitAnswers,
  parseInitConfigFile,
  updateInitConfigFile,
} from './init'
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
  --name <value>                      Project name used in docs metadata
  --title <value>                     Site title used in docs metadata
  --origin <url>                      Canonical site origin (default: detected GitHub Pages host)
  --base-path <path>                  Base URL path (default: /<repo-name>)
  --content-dir <path>                Docs content directory (default: docs)
  --search / --no-search              Enable or disable built-in search
  --starter-content / --no-starter-content
                                      Create or skip starter guide/reference pages

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

function readPackageName(projectDir: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(resolve(projectDir, 'package.json'), 'utf-8'))
    const raw: string | undefined = pkg.name
    return raw?.replace(/^@[^/]+\//, '') // strip npm scope
  } catch {
    return undefined
  }
}

async function detectDefaults(projectDir: string): Promise<InitAnswers> {
  const gitInfo = detectGitOrigin(projectDir)
  const pkgName = readPackageName(projectDir)
  const name = gitInfo?.repoName ?? pkgName ?? basename(projectDir)
  const basePath = gitInfo?.basePath ?? `/${name}`
  const origin =
    (await resolveInitOrigin(projectDir, gitInfo)) ?? gitInfo?.origin ?? 'https://example.com'
  const copyrightStartYear = detectFirstCommitYear(projectDir) ?? new Date().getFullYear()

  return {
    name,
    title: toTitleCase(name),
    origin,
    basePath,
    contentDir: 'docs',
    copyrightStartYear,
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
  const titleFallback =
    defaults.title === toTitleCase(defaults.name) ? toTitleCase(name) : defaults.title
  const title = await ask('Site title', titleFallback)
  const origin = await ask('Site origin', defaults.origin)
  const basePath = await ask('Base path', defaults.basePath)
  const contentDir = await ask('Content directory', defaults.contentDir)
  const search = await confirm('Enable search?', defaults.search)
  const ai = await confirm('Install AI integrations?', defaults.ai)
  const starterContent = await confirm('Create starter content?', defaults.starterContent)

  cleanup()
  console.log()

  return {
    name,
    title,
    origin,
    basePath,
    contentDir,
    copyrightStartYear: defaults.copyrightStartYear,
    search,
    ai,
    starterContent,
  }
}

// ---------------------------------------------------------------------------
// Init logic
// ---------------------------------------------------------------------------

function scriptCommand(command: 'dev' | 'build' | 'preview', configPath?: string): string {
  const base = `pagesmith ${command}`
  if (!configPath || configPath === 'pagesmith.config.json5') {
    return base
  }
  return `${base} --config ${configPath}`
}

function ensureDocsScripts(projectDir: string, configPath?: string): string[] {
  const pkgPath = resolve(projectDir, 'package.json')
  if (!existsSync(pkgPath)) return []

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      scripts?: Record<string, string>
    }
    const scripts = { ...(pkg.scripts ?? {}) }
    const desired = {
      'docs:dev': scriptCommand('dev', configPath),
      'docs:build': scriptCommand('build', configPath),
      'docs:preview': scriptCommand('preview', configPath),
    }
    const created: string[] = []
    let changed = false

    for (const [name, value] of Object.entries(desired)) {
      if (!scripts[name]) {
        scripts[name] = value
        created.push(`package.json#scripts.${name}`)
        changed = true
      }
    }

    if (!changed) return created

    pkg.scripts = scripts
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    return created
  } catch {
    return []
  }
}

function writeIfMissing(filePath: string, content: string): boolean {
  if (existsSync(filePath)) return false
  writeFileSync(filePath, content)
  return true
}

async function runInit(argv: string[]): Promise<void> {
  const args = parseInitArgs(argv)
  if (args._help) {
    printHelp()
    return
  }
  const projectDir = resolve('.')
  const configPath = resolve(args.config ?? 'pagesmith.config.json5')
  const hasPackageJson = existsSync(resolve(projectDir, 'package.json'))
  const existingConfig = parseInitConfigFile(configPath)

  let defaults = await detectDefaults(projectDir)
  defaults = applyExistingConfigDefaults(defaults, existingConfig)

  // --ai flag pre-selects AI integrations even in interactive mode
  if (args.ai) defaults.ai = true
  if (args.name) defaults.name = args.name
  if (args.title) defaults.title = args.title
  if (args.origin) defaults.origin = args.origin
  if (args.basePath) defaults.basePath = args.basePath
  if (args.contentDir) defaults.contentDir = args.contentDir
  if (typeof args.search === 'boolean') defaults.search = args.search
  if (typeof args.starterContent === 'boolean') defaults.starterContent = args.starterContent

  // Resolve answers: interactive or accept defaults
  const answers = args.yes ? defaults : await promptInteractive(defaults)

  const created: string[] = []
  const updated: string[] = []

  // 1. Create config file
  const configResult = updateInitConfigFile({ projectDir, configPath, answers })
  if (configResult.created) {
    created.push(args.config ?? 'pagesmith.config.json5')
  } else if (configResult.updated) {
    updated.push(args.config ?? 'pagesmith.config.json5')
  }

  // 2. Add docs scripts to package.json when available
  const scriptEntries = ensureDocsScripts(projectDir, args.config ?? 'pagesmith.config.json5')
  created.push(...scriptEntries)

  // 3. Create content directory structure
  const contentDir = resolve(answers.contentDir)
  const dirs = [
    contentDir,
    resolve(contentDir, 'guide'),
    resolve(contentDir, 'reference'),
    resolve(contentDir, 'guide', 'getting-started'),
    resolve(contentDir, 'guide', 'configuration'),
    resolve(contentDir, 'reference', 'overview'),
    resolve(contentDir, 'reference', 'api'),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  // 4. Starter content
  if (answers.starterContent) {
    const homePath = resolve(contentDir, 'README.md')
    if (
      writeIfMissing(
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
          '  - text: Reference',
          '    link: /reference/overview',
          '    theme: alt',
          'features:',
          '  - title: Convention-based docs',
          '    details: Organize docs with folders, README.md pages, and meta.json5 ordering.',
          '  - title: GitHub Pages friendly',
          '    details: Defaults to a GitHub Pages base path using the repo name.',
          '---',
          '',
          '# Welcome',
          '',
          'Start from the guide, then expand the reference as your project grows.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/README.md`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'guide', 'meta.json5'),
        [
          '{',
          "  displayName: 'Guide',",
          "  orderBy: 'manual',",
          "  items: ['getting-started', 'configuration'],",
          '}',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/guide/meta.json5`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'guide', 'README.md'),
        [
          '---',
          'title: Guide',
          'description: Start here to learn how this project is documented.',
          '---',
          '',
          '# Guide',
          '',
          'Use this section for onboarding, setup, and configuration walkthroughs.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/guide/README.md`)
    }

    const gettingStartedPath = resolve(contentDir, 'guide', 'getting-started', 'README.md')
    if (
      writeIfMissing(
        gettingStartedPath,
        [
          '---',
          'title: Getting Started',
          'description: Learn the basics of this project and its docs site.',
          '---',
          '',
          '# Getting Started',
          '',
          'Explain how to install, run, and explore the project here.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/guide/getting-started/README.md`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'guide', 'configuration', 'README.md'),
        [
          '---',
          'title: Configuration',
          'description: Document the key configuration and setup decisions for this project.',
          '---',
          '',
          '# Configuration',
          '',
          'Document environment variables, config files, and deployment expectations here.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/guide/configuration/README.md`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'reference', 'meta.json5'),
        [
          '{',
          "  displayName: 'Reference',",
          "  orderBy: 'manual',",
          "  items: ['overview', 'api'],",
          '}',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/reference/meta.json5`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'reference', 'README.md'),
        [
          '---',
          'title: Reference',
          'description: API and implementation reference for this project.',
          '---',
          '',
          '# Reference',
          '',
          'Use this section for API details, commands, and integration notes.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/reference/README.md`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'reference', 'overview', 'README.md'),
        [
          '---',
          'title: Overview',
          'description: A high-level reference map for the project.',
          '---',
          '',
          '# Overview',
          '',
          'Summarize the major modules, packages, or subsystems here.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/reference/overview/README.md`)
    }

    if (
      writeIfMissing(
        resolve(contentDir, 'reference', 'api', 'README.md'),
        [
          '---',
          'title: API',
          'description: Public API reference for this project.',
          '---',
          '',
          '# API',
          '',
          'List commands, exports, endpoints, or interfaces here.',
          '',
        ].join('\n'),
      )
    ) {
      created.push(`${answers.contentDir}/reference/api/README.md`)
    }
  }

  // 5. AI integrations
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

  // 6. Summary
  if (created.length > 0) {
    console.log('  Created:')
    for (const file of created) {
      console.log(`    ${file}`)
    }
  }
  if (updated.length > 0) {
    console.log('  Updated:')
    for (const file of updated) {
      console.log(`    ${file}`)
    }
  }

  console.log('\n  Done! Next steps:')
  console.log(
    `    ${hasPackageJson ? 'npm run docs:dev' : `npx ${scriptCommand('dev', args.config ?? 'pagesmith.config.json5')}`}`,
  )
  console.log(
    '    If you want to host docs at the root of a GitHub Pages site, edit basePath/origin in pagesmith.config.json5 manually.',
  )
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
    configPath: await ensureDocsConfig(args.config, { allowMissing: true }),
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
    configPath: await ensureDocsConfig(args.config, { allowMissing: true }),
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
