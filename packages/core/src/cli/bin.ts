#!/usr/bin/env node

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { installAiArtifacts } from '../ai/index.js'
import { createProject, listTemplates } from '../create/index.js'

type AiCliArgs = {
  assistants?: Array<'claude' | 'codex' | 'gemini'>
  scope?: 'project' | 'user'
  profile?: 'default' | 'docs'
  cwd?: string
  homeDir?: string
  skillName?: string
  includeLlms?: boolean
  dryRun?: boolean
  _help?: boolean
}

type CreateCliArgs = {
  template?: string
  _help?: boolean
}

function getVersion(): string {
  const pkgPath = resolve(import.meta.dirname, '..', '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
  return pkg.version ?? '0.0.0'
}

function printHelp(): void {
  console.log(
    `
pagesmith-core (@pagesmith/core)

Commands:
  templates                          List available starter templates
  create <project-name> [options]    Create a starter project
  ai [options]                       Install Pagesmith AI artifacts

Create options:
  --template <name>                  Template name (required)

AI options:
  --assistant <name>                 claude|codex|gemini (repeatable; default: all)
  --scope <scope>                    project|user (default: project)
  --profile <profile>                default|docs (default: default)
  --cwd <path>                       Project directory for project-scope installs
  --home-dir <path>                  Home directory override for user-scope installs
  --skill-name <name>                Custom skill/command name
  --no-llms                          Skip llms.txt / llms-full.txt generation
  --dry-run                          Show planned writes without changing files

General:
  -v, --version                      Print version
  -h, --help                         Print help
`.trim(),
  )
}

function parseCreateArgs(argv: string[]): CreateCliArgs {
  const args: CreateCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true }
    }

    if (arg === '--template') {
      const value = argv[++index]
      if (!value) throw new Error('--template requires a value')
      args.template = value
      continue
    }

    if (arg.startsWith('--template=')) {
      const value = arg.slice('--template='.length)
      if (!value) throw new Error('--template= requires a value')
      args.template = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith-core --help' for usage.`)
    }
  }

  return args
}

function parseAssistant(value: string): 'claude' | 'codex' | 'gemini' {
  if (value === 'claude' || value === 'codex' || value === 'gemini') {
    return value
  }
  throw new Error(`--assistant must be one of: claude, codex, gemini (got "${value}")`)
}

function parseScope(value: string): 'project' | 'user' {
  if (value === 'project' || value === 'user') {
    return value
  }
  throw new Error(`--scope must be one of: project, user (got "${value}")`)
}

function parseProfile(value: string): 'default' | 'docs' {
  if (value === 'default' || value === 'docs') {
    return value
  }
  throw new Error(`--profile must be one of: default, docs (got "${value}")`)
}

function parseAiArgs(argv: string[]): AiCliArgs {
  const args: AiCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true }
    }

    if (arg === '--assistant') {
      const value = argv[++index]
      if (!value) throw new Error('--assistant requires a value')
      args.assistants = [...(args.assistants ?? []), parseAssistant(value)]
      continue
    }

    if (arg.startsWith('--assistant=')) {
      const value = arg.slice('--assistant='.length)
      if (!value) throw new Error('--assistant= requires a value')
      args.assistants = [...(args.assistants ?? []), parseAssistant(value)]
      continue
    }

    if (arg === '--scope') {
      const value = argv[++index]
      if (!value) throw new Error('--scope requires a value')
      args.scope = parseScope(value)
      continue
    }

    if (arg.startsWith('--scope=')) {
      const value = arg.slice('--scope='.length)
      if (!value) throw new Error('--scope= requires a value')
      args.scope = parseScope(value)
      continue
    }

    if (arg === '--profile') {
      const value = argv[++index]
      if (!value) throw new Error('--profile requires a value')
      args.profile = parseProfile(value)
      continue
    }

    if (arg.startsWith('--profile=')) {
      const value = arg.slice('--profile='.length)
      if (!value) throw new Error('--profile= requires a value')
      args.profile = parseProfile(value)
      continue
    }

    if (arg === '--cwd') {
      const value = argv[++index]
      if (!value) throw new Error('--cwd requires a path')
      args.cwd = value
      continue
    }

    if (arg.startsWith('--cwd=')) {
      const value = arg.slice('--cwd='.length)
      if (!value) throw new Error('--cwd= requires a path')
      args.cwd = value
      continue
    }

    if (arg === '--home-dir') {
      const value = argv[++index]
      if (!value) throw new Error('--home-dir requires a path')
      args.homeDir = value
      continue
    }

    if (arg.startsWith('--home-dir=')) {
      const value = arg.slice('--home-dir='.length)
      if (!value) throw new Error('--home-dir= requires a path')
      args.homeDir = value
      continue
    }

    if (arg === '--skill-name') {
      const value = argv[++index]
      if (!value) throw new Error('--skill-name requires a value')
      args.skillName = value
      continue
    }

    if (arg.startsWith('--skill-name=')) {
      const value = arg.slice('--skill-name='.length)
      if (!value) throw new Error('--skill-name= requires a value')
      args.skillName = value
      continue
    }

    if (arg === '--no-llms') {
      args.includeLlms = false
      continue
    }

    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith-core --help' for usage.`)
    }
  }

  return args
}

async function runCreate(argv: string[]): Promise<void> {
  const [projectName, ...rest] = argv
  const args = parseCreateArgs(rest)
  if (args._help) {
    printHelp()
    return
  }
  if (!projectName) {
    throw new Error(
      `pagesmith-core create requires a project name.\n` +
        `  Example: pagesmith-core create my-site --template react`,
    )
  }
  if (!args.template) {
    throw new Error(
      `pagesmith-core create requires --template.\nAvailable templates:\n${listTemplates()}`,
    )
  }
  await createProject(projectName, args.template)
}

function runTemplates(): void {
  console.log(listTemplates())
}

function runAi(argv: string[]): void {
  const args = parseAiArgs(argv)
  if (args._help) {
    printHelp()
    return
  }

  const results = installAiArtifacts({
    assistants: args.assistants,
    scope: args.scope,
    profile: args.profile,
    cwd: args.cwd,
    homeDir: args.homeDir,
    skillName: args.skillName,
    includeLlms: args.includeLlms,
    dryRun: args.dryRun,
  })

  for (const result of results) {
    console.log(`${result.status}: ${result.label} -> ${result.path}`)
  }
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

  if (command === 'templates') {
    runTemplates()
    return
  }

  if (command === 'create') {
    await runCreate(rest)
    return
  }

  if (command === 'ai') {
    runAi(rest)
    return
  }

  throw new Error(
    `Unknown command: ${command}. Run 'pagesmith-core --help' for available commands.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
