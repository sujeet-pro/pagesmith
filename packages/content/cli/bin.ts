#!/usr/bin/env node

import { resolve } from 'path'
import { installAiArtifacts, type AiAssistant, type AiInstallScope } from '../src/ai/index'
import { renderDiagrams, watchDiagrams } from '../src/diagrams/index'

type DiagramCliArgs = {
  folder: string
  force: boolean
  watch: boolean
  file?: string
  type?: 'mermaid' | 'excalidraw' | 'drawio'
}

type AiCliArgs = {
  assistant: AiAssistant | 'all'
  scope: AiInstallScope
  cwd?: string
  homeDir?: string
  force: boolean
  includeLlms: boolean
  skillName?: string
}

function parseDiagramArgs(argv: string[]): DiagramCliArgs {
  const args: DiagramCliArgs = {
    folder: process.cwd(),
    force: false,
    watch: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!

    if (arg === '--force' || arg === '-f') {
      args.force = true
      continue
    }

    if (arg === '--watch' || arg === '-w') {
      args.watch = true
      continue
    }

    if (arg === '--file') {
      const value = argv[++i]
      if (!value) {
        throw new Error('--file requires a path')
      }
      args.file = resolve(value)
      continue
    }

    if (arg === '--type' || arg === '-t') {
      const value = argv[++i]
      if (value !== 'mermaid' && value !== 'excalidraw' && value !== 'drawio') {
        throw new Error('--type must be mermaid, excalidraw, or drawio')
      }
      args.type = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }

    args.folder = resolve(arg)
  }

  return args
}

function parseAiArgs(argv: string[]): AiCliArgs {
  const args: AiCliArgs = {
    assistant: 'all',
    scope: 'project',
    force: false,
    includeLlms: true,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!

    if (arg === '--assistant' || arg === '--tool') {
      const value = argv[++i]
      if (value !== 'all' && value !== 'claude' && value !== 'codex' && value !== 'gemini') {
        throw new Error('--assistant must be all, claude, codex, or gemini')
      }
      args.assistant = value
      continue
    }

    if (arg === '--scope') {
      const value = argv[++i]
      if (value !== 'project' && value !== 'user') {
        throw new Error('--scope must be project or user')
      }
      args.scope = value
      continue
    }

    if (arg === '--cwd') {
      const value = argv[++i]
      if (!value) {
        throw new Error('--cwd requires a path')
      }
      args.cwd = resolve(value)
      continue
    }

    if (arg === '--home-dir') {
      const value = argv[++i]
      if (!value) {
        throw new Error('--home-dir requires a path')
      }
      args.homeDir = resolve(value)
      continue
    }

    if (arg === '--skill-name') {
      const value = argv[++i]
      if (!value) {
        throw new Error('--skill-name requires a value')
      }
      args.skillName = value
      continue
    }

    if (arg === '--force') {
      args.force = true
      continue
    }

    if (arg === '--no-llms') {
      args.includeLlms = false
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
pagesmith-content

Commands:
  diagrams [options] [folder]         Render diagrams with diagramkit
  ai install [options]                Install assistant memory, skills, and llms files

Diagrams options:
  --force, -f                         Re-render all diagrams
  --watch, -w                         Watch for changes
  --file <path>                       Render a single file
  --type, -t <type>                   mermaid | excalidraw | drawio

AI install options:
  --assistant <name>                  all | claude | codex | gemini
  --scope <scope>                     project | user
  --cwd <path>                        Project root for project installs
  --home-dir <path>                   Home directory override for user installs
  --skill-name <name>                 Override the installed skill/command name
  --force                             Replace existing managed blocks/files
  --no-llms                           Skip llms.txt and llms-full.txt
`.trim(),
  )
}

async function runDiagrams(argv: string[]): Promise<void> {
  const args = parseDiagramArgs(argv)

  await renderDiagrams({
    contentDir: args.folder,
    force: args.force,
    file: args.file,
    type: args.type,
  })

  if (args.watch) {
    watchDiagrams({ contentDir: args.folder })
  }
}

function runAi(argv: string[]): void {
  const subcommand = argv[0]
  if (subcommand !== 'install') {
    throw new Error(`Unknown ai subcommand: ${subcommand ?? '(missing)'}`)
  }

  const args = parseAiArgs(argv.slice(1))
  const results = installAiArtifacts({
    assistants: args.assistant === 'all' ? 'all' : [args.assistant],
    scope: args.scope,
    cwd: args.cwd,
    homeDir: args.homeDir,
    force: args.force,
    includeLlms: args.includeLlms,
    skillName: args.skillName,
  })

  for (const result of results) {
    console.log(`${result.status.padEnd(9)} ${result.path}`)
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'diagrams') {
    await runDiagrams(rest)
    return
  }

  if (command === 'ai') {
    runAi(rest)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
