#!/usr/bin/env node

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { installAiArtifacts } from '../ai/index.js'
import { createProject, listTemplates } from '../create/index.js'
import { installPackageSkills } from './skills-install.js'
import { readCoreCliDefaults } from './project-config.js'
import {
  intro,
  isInteractive,
  outro,
  promptConfirm,
  promptMultiselect,
  promptSelect,
  promptText,
} from './interactive.js'

type AiCliArgs = {
  assistants?: Array<'claude' | 'codex' | 'gemini'>
  scope?: 'project' | 'user'
  profile?: 'default' | 'docs'
  cwd?: string
  homeDir?: string
  skillName?: string
  includeLlms?: boolean
  dryRun?: boolean
  yes?: boolean
  _help?: boolean
}

type CreateCliArgs = {
  template?: string
  yes?: boolean
  _help?: boolean
}

type SkillsCliArgs = {
  packages?: string[]
  cwd?: string
  dryRun?: boolean
  overwriteCanonical?: boolean
  yes?: boolean
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
  ai [options]                       Install Pagesmith AI memory/skill artifacts
  skills [options]                   Install consumer skills from Pagesmith packages

Create options:
  --template <name>                  Template name
  -y, --yes                          Skip prompts, require all args upfront

AI options:
  --assistant <name>                 claude|codex|gemini (repeatable; default: all)
  --scope <scope>                    project|user (default: project)
  --profile <profile>                default|docs (default: default)
  --cwd <path>                       Project directory for project-scope installs
  --home-dir <path>                  Home directory override for user-scope installs
  --skill-name <name>                Custom skill/command name
  --no-llms                          Skip llms.txt / llms-full.txt generation
  --dry-run                          Show planned writes without changing files
  -y, --yes                          Skip prompts, use defaults/flags only

Skills options:
  --package <pkg>                    Pagesmith package to pull skills from (repeatable)
                                       default: @pagesmith/core @pagesmith/site @pagesmith/docs
  --cwd <path>                       Project directory (default: cwd)
  --dry-run                          Show planned writes without changing files
  --no-overwrite                     Keep existing canonical skills unchanged
  -y, --yes                          Skip prompts

General:
  -v, --version                      Print version
  -h, --help                          Print help

Interactive mode is automatic when stdout is a TTY and --yes is not passed.
Set PAGESMITH_NON_INTERACTIVE=1 or CI=1 to force non-interactive mode.

Project defaults: values in pagesmith-core.config.json5 (or the cli.core block
of pagesmith.config.json5) are used as prompt defaults.
`.trim(),
  )
}

// ---------------------------------------------------------------------------
// Arg parsers (small, strict; interactive flow fills in missing values)
// ---------------------------------------------------------------------------

function consumeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1]
  if (!value) throw new Error(`${flag} requires a value`)
  return value
}

function parseAssistant(value: string): 'claude' | 'codex' | 'gemini' {
  if (value === 'claude' || value === 'codex' || value === 'gemini') return value
  throw new Error(`--assistant must be one of: claude, codex, gemini (got "${value}")`)
}

function parseScope(value: string): 'project' | 'user' {
  if (value === 'project' || value === 'user') return value
  throw new Error(`--scope must be one of: project, user (got "${value}")`)
}

function parseProfile(value: string): 'default' | 'docs' {
  if (value === 'default' || value === 'docs') return value
  throw new Error(`--profile must be one of: default, docs (got "${value}")`)
}

function parseCreateArgs(argv: string[]): CreateCliArgs {
  const args: CreateCliArgs = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!
    if (a === '--help' || a === '-h') return { ...args, _help: true }
    if (a === '-y' || a === '--yes') {
      args.yes = true
      continue
    }
    if (a === '--template') {
      args.template = consumeValue(argv, i, a)
      i += 1
      continue
    }
    if (a.startsWith('--template=')) {
      args.template = a.slice('--template='.length)
      continue
    }
    if (a.startsWith('-')) throw new Error(`Unknown option: ${a}. Run 'pagesmith-core --help'.`)
  }
  return args
}

function parseAiArgs(argv: string[]): AiCliArgs {
  const args: AiCliArgs = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!
    if (a === '--help' || a === '-h') return { ...args, _help: true }
    if (a === '-y' || a === '--yes') {
      args.yes = true
      continue
    }
    if (a === '--assistant') {
      args.assistants = [...(args.assistants ?? []), parseAssistant(consumeValue(argv, i, a))]
      i += 1
      continue
    }
    if (a.startsWith('--assistant=')) {
      args.assistants = [...(args.assistants ?? []), parseAssistant(a.slice('--assistant='.length))]
      continue
    }
    if (a === '--scope') {
      args.scope = parseScope(consumeValue(argv, i, a))
      i += 1
      continue
    }
    if (a.startsWith('--scope=')) {
      args.scope = parseScope(a.slice('--scope='.length))
      continue
    }
    if (a === '--profile') {
      args.profile = parseProfile(consumeValue(argv, i, a))
      i += 1
      continue
    }
    if (a.startsWith('--profile=')) {
      args.profile = parseProfile(a.slice('--profile='.length))
      continue
    }
    if (a === '--cwd') {
      args.cwd = consumeValue(argv, i, a)
      i += 1
      continue
    }
    if (a.startsWith('--cwd=')) {
      args.cwd = a.slice('--cwd='.length)
      continue
    }
    if (a === '--home-dir') {
      args.homeDir = consumeValue(argv, i, a)
      i += 1
      continue
    }
    if (a.startsWith('--home-dir=')) {
      args.homeDir = a.slice('--home-dir='.length)
      continue
    }
    if (a === '--skill-name') {
      args.skillName = consumeValue(argv, i, a)
      i += 1
      continue
    }
    if (a.startsWith('--skill-name=')) {
      args.skillName = a.slice('--skill-name='.length)
      continue
    }
    if (a === '--no-llms') {
      args.includeLlms = false
      continue
    }
    if (a === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (a.startsWith('-')) throw new Error(`Unknown option: ${a}. Run 'pagesmith-core --help'.`)
  }
  return args
}

function parseSkillsArgs(argv: string[]): SkillsCliArgs {
  const args: SkillsCliArgs = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!
    if (a === '--help' || a === '-h') return { ...args, _help: true }
    if (a === '-y' || a === '--yes') {
      args.yes = true
      continue
    }
    if (a === '--package') {
      args.packages = [...(args.packages ?? []), consumeValue(argv, i, a)]
      i += 1
      continue
    }
    if (a.startsWith('--package=')) {
      args.packages = [...(args.packages ?? []), a.slice('--package='.length)]
      continue
    }
    if (a === '--cwd') {
      args.cwd = consumeValue(argv, i, a)
      i += 1
      continue
    }
    if (a.startsWith('--cwd=')) {
      args.cwd = a.slice('--cwd='.length)
      continue
    }
    if (a === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (a === '--no-overwrite') {
      args.overwriteCanonical = false
      continue
    }
    if (a.startsWith('-')) throw new Error(`Unknown option: ${a}. Run 'pagesmith-core --help'.`)
  }
  return args
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function runCreate(argv: string[]): Promise<void> {
  const [projectName, ...rest] = argv
  const args = parseCreateArgs(rest)
  if (args._help) {
    printHelp()
    return
  }

  const defaults = readCoreCliDefaults()
  const canPrompt = isInteractive() && !args.yes

  if (!projectName && !canPrompt) {
    throw new Error(
      `pagesmith-core create requires a project name.\n  Example: pagesmith-core create my-site --template react`,
    )
  }
  if (!args.template && !defaults.create?.template && !canPrompt) {
    throw new Error(
      `pagesmith-core create requires --template.\nAvailable templates:\n${listTemplates()}`,
    )
  }

  let finalName = projectName
  let finalTemplate = args.template ?? defaults.create?.template

  if (canPrompt) {
    intro('Pagesmith — create project')
    if (!finalName) {
      finalName = await promptText({
        message: 'Project name',
        placeholder: 'my-site',
        validate: (v) => (v && v.trim() ? undefined : 'Project name is required'),
      })
    }
    if (!finalTemplate) {
      const templateNames = listTemplates()
        .split('\n')
        .map((line) => line.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
      finalTemplate = await promptSelect({
        message: 'Template',
        options: templateNames.map((name) => ({ value: name, label: name })),
        initialValue: defaults.create?.template,
      })
    }
  }

  await createProject(finalName!, finalTemplate!)
  if (canPrompt) outro('Project created.')
}

function runTemplates(): void {
  console.log(listTemplates())
}

async function runAi(argv: string[]): Promise<void> {
  const args = parseAiArgs(argv)
  if (args._help) {
    printHelp()
    return
  }

  const defaults = readCoreCliDefaults().ai ?? {}
  const canPrompt = isInteractive() && !args.yes

  let assistants = args.assistants ?? defaults.assistants
  let scope = args.scope ?? defaults.scope
  let profile = args.profile ?? defaults.profile
  let skillName = args.skillName ?? defaults.skillName
  let includeLlms = args.includeLlms ?? defaults.includeLlms

  if (canPrompt) {
    intro('Pagesmith — install AI artifacts')
    if (!assistants || assistants.length === 0) {
      assistants = await promptMultiselect<'claude' | 'codex' | 'gemini'>({
        message: 'Which assistants?',
        options: [
          { value: 'claude', label: 'Claude' },
          { value: 'codex', label: 'Codex' },
          { value: 'gemini', label: 'Gemini' },
        ],
        initialValues: ['claude', 'codex', 'gemini'],
        required: true,
      })
    }
    if (!scope) {
      scope = await promptSelect<'project' | 'user'>({
        message: 'Scope',
        options: [
          { value: 'project', label: 'Project', hint: 'write into the current repo' },
          { value: 'user', label: 'User', hint: 'write into the user home directory' },
        ],
        initialValue: 'project',
      })
    }
    if (!profile) {
      profile = await promptSelect<'default' | 'docs'>({
        message: 'Profile',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'docs', label: 'Docs', hint: 'optimized for @pagesmith/docs projects' },
        ],
        initialValue: 'default',
      })
    }
    if (includeLlms === undefined && scope === 'project') {
      includeLlms = await promptConfirm({
        message: 'Generate llms.txt / llms-full.txt?',
        initialValue: true,
      })
    }
  }

  const results = installAiArtifacts({
    assistants,
    scope,
    profile,
    cwd: args.cwd,
    homeDir: args.homeDir,
    skillName,
    includeLlms,
    dryRun: args.dryRun,
  })

  for (const result of results) {
    console.log(`${result.status}: ${result.label} -> ${result.path}`)
  }
  if (canPrompt) outro(args.dryRun ? 'Dry run complete.' : 'AI artifacts installed.')
}

async function runSkills(argv: string[]): Promise<void> {
  const args = parseSkillsArgs(argv)
  if (args._help) {
    printHelp()
    return
  }

  const defaults = readCoreCliDefaults().skills ?? {}
  const canPrompt = isInteractive() && !args.yes

  let packages = args.packages ?? defaults.packages

  if (canPrompt && (!packages || packages.length === 0)) {
    intro('Pagesmith — install package skills')
    packages = await promptMultiselect<string>({
      message: 'Which packages?',
      options: [
        { value: '@pagesmith/core', label: '@pagesmith/core' },
        { value: '@pagesmith/site', label: '@pagesmith/site' },
        { value: '@pagesmith/docs', label: '@pagesmith/docs' },
      ],
      initialValues: ['@pagesmith/core', '@pagesmith/site', '@pagesmith/docs'],
      required: true,
    })
  }

  const results = installPackageSkills({
    packages,
    cwd: args.cwd,
    dryRun: args.dryRun,
    overwriteCanonical: args.overwriteCanonical,
  })

  for (const r of results) {
    console.log(`${r.status}: ${r.label} -> ${r.path}`)
  }
  if (canPrompt) outro(args.dryRun ? 'Dry run complete.' : 'Skills installed.')
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

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
    await runAi(rest)
    return
  }
  if (command === 'skills') {
    await runSkills(rest)
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
