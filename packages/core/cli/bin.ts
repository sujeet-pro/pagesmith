#!/usr/bin/env -S node --experimental-transform-types

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

type DiagramCliArgs = {
  folder: string
  force: boolean
  watch: boolean
  file?: string
  type?: 'mermaid' | 'excalidraw' | 'drawio'
}

type AiCliArgs = {
  assistant: 'claude' | 'codex' | 'gemini' | 'all'
  scope: 'project' | 'user'
  profile: 'default' | 'docs'
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
    profile: 'default',
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

    if (arg === '--docs') {
      args.profile = 'docs'
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
pagesmith — file-based CMS

Commands:
  dev [options]                       Start dev server with HMR
  build [options]                     Build the site
  preview [options]                   Preview the built site
  convert <file.md> [options]         Convert markdown to HTML
  toc <file.md|file.html>             Extract TOC as JSON
  diagrams [options] [folder]         Render diagrams with diagramkit
  create <project> [options]          Scaffold a new Pagesmith project
  ai install [options]                Install assistant memory, skills, and llms files

Dev/Build/Preview options:
  --port <number>                     Server port (dev: 3000, preview: 4000)
  --open                              Open browser on server start
  --out-dir <path>                    Output directory (overrides config)
  --base-path <path>                  Base URL path prefix (overrides config)
  --config <path>                     Config file path

Convert options:
  -o, --output <path>                 Write to file (default: stdout)
  -m, --mode <mode>                   full | fragment (default: full)
  --css <mode>                        inline | reference | none (default: inline)
  --js <mode>                         inline | reference | none (default: inline)
  --no-toc                            Omit TOC sidebar
  --title <title>                     Override frontmatter title
  -w, --watch                         Watch and rebuild on change

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
  --docs                             Install docs-specific assistant guidance
  --force                             Replace existing managed blocks/files
  --no-llms                           Skip llms.txt and llms-full.txt

Create options:
  --template <name>                   docs | blog | react | solid | svelte | ejs | hbs (default: docs)
  --list                              List available templates
`.trim(),
  )
}

async function runCreate(argv: string[]): Promise<void> {
  const { createProject, listTemplates } = await import('@pagesmith/core/create')

  // Check for --list flag
  if (argv.includes('--list')) {
    console.log('Available templates:\n')
    console.log(listTemplates())
    console.log()
    return
  }

  const projectName = argv[0]
  if (!projectName || projectName.startsWith('-')) {
    throw new Error(
      'Usage: pagesmith create <project-name> [--template <name>]\n\n' +
        'Available templates:\n' +
        listTemplates(),
    )
  }

  let template = 'docs'

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--template' || arg === '-t') {
      template = argv[++i] ?? template
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  await createProject(projectName, template)
}

async function runDiagrams(argv: string[]): Promise<void> {
  const args = parseDiagramArgs(argv)
  const { renderDiagrams, watchDiagrams } = await import('@pagesmith/core/diagrams')

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

async function runAi(argv: string[]): Promise<void> {
  const subcommand = argv[0]
  if (subcommand !== 'install') {
    throw new Error(`Unknown ai subcommand: ${subcommand ?? '(missing)'}`)
  }

  const { installAiArtifacts } = await import('@pagesmith/core/ai')

  const args = parseAiArgs(argv.slice(1))
  const results = installAiArtifacts({
    assistants: args.assistant === 'all' ? 'all' : [args.assistant],
    scope: args.scope,
    profile: args.profile,
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

async function runConvert(argv: string[]): Promise<void> {
  const file = argv[0]
  if (!file) {
    console.error('Usage: pagesmith convert <file.md> [options]')
    process.exit(1)
  }

  const { convert } = await import('@pagesmith/core')

  const getArg = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`)
    if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1]
    const shortMap: Record<string, string> = { o: 'output', m: 'mode' }
    const short = Object.entries(shortMap).find(([, v]) => v === name)?.[0]
    if (short) {
      const shortIdx = argv.indexOf(`-${short}`)
      if (shortIdx >= 0 && shortIdx + 1 < argv.length) return argv[shortIdx + 1]
    }
    return undefined
  }

  const input = readFileSync(resolve(file), 'utf-8')
  const mode = (getArg('mode') || 'full') as 'full' | 'fragment'
  const cssMode = (getArg('css') || 'inline') as 'inline' | 'reference' | 'none'
  const jsMode = (getArg('js') || 'inline') as 'inline' | 'reference' | 'none'
  const noToc = argv.includes('--no-toc')
  const title = getArg('title')

  const result = await convert(input, { mode, css: cssMode, js: jsMode, noToc })
  if (title) result.frontmatter.title = title

  const output = getArg('output')
  if (output) {
    writeFileSync(resolve(output), result.html)
    console.log(`Written to ${output}`)
  } else {
    process.stdout.write(result.html)
  }

  if (argv.includes('--watch') || argv.includes('-w')) {
    const { watch } = await import('fs')
    console.error(`Watching ${file} for changes...`)
    watch(resolve(file), async () => {
      try {
        const raw = readFileSync(resolve(file), 'utf-8')
        const r = await convert(raw, { mode, css: cssMode, js: jsMode, noToc })
        if (output) {
          writeFileSync(resolve(output), r.html)
          console.error(`Rebuilt ${output}`)
        }
      } catch (err) {
        console.error('Rebuild error:', err)
      }
    })
  }
}

async function runToc(argv: string[]): Promise<void> {
  const file = argv[0]
  if (!file) {
    console.error('Usage: pagesmith toc <file.md|file.html>')
    process.exit(1)
  }

  const raw = readFileSync(resolve(file), 'utf-8')

  if (file.endsWith('.html')) {
    const { extractToc } = await import('@pagesmith/core')
    console.log(JSON.stringify(extractToc(raw), null, 2))
  } else {
    const { convert } = await import('@pagesmith/core')
    const result = await convert(raw, { mode: 'fragment' })
    console.log(JSON.stringify(result.toc, null, 2))
  }
}

type ServerCliArgs = {
  port?: number
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
}

function parseServerArgs(argv: string[]): ServerCliArgs {
  const args: ServerCliArgs = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!

    if (arg === '--port') {
      const value = argv[++i]
      if (!value) throw new Error('--port requires a number')
      args.port = parseInt(value, 10)
      if (isNaN(args.port)) throw new Error('--port must be a valid number')
      continue
    }

    if (arg === '--config') {
      const value = argv[++i]
      if (!value) throw new Error('--config requires a path')
      args.config = resolve(value)
      continue
    }

    if (arg === '--open') {
      args.open = true
      continue
    }

    if (arg === '--out-dir') {
      const value = argv[++i]
      if (!value) throw new Error('--out-dir requires a path')
      args.outDir = resolve(value)
      continue
    }

    if (arg === '--base-path') {
      const value = argv[++i]
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

/**
 * Detect the config mode and load the appropriate config.
 *
 * - pagesmith.config.ts  -> load with dynamic import, use core content layer + dev server
 * - pagesmith.config.json5 -> try @pagesmith/docs preset, fall back to help
 * - neither -> print help
 */
async function detectConfig(
  configPath?: string,
): Promise<{ mode: 'ts' | 'json5' | 'none'; path?: string }> {
  const { existsSync } = await import('fs')

  if (configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`)
    }
    if (configPath.endsWith('.ts')) return { mode: 'ts', path: configPath }
    if (configPath.endsWith('.json5')) return { mode: 'json5', path: configPath }
    throw new Error(`Unsupported config format: ${configPath}`)
  }

  const cwd = process.cwd()
  const tsConfig = resolve(cwd, 'pagesmith.config.ts')
  if (existsSync(tsConfig)) return { mode: 'ts', path: tsConfig }

  const json5Config = resolve(cwd, 'pagesmith.config.json5')
  if (existsSync(json5Config)) return { mode: 'json5', path: json5Config }

  return { mode: 'none' }
}

async function runDev(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  const config = await detectConfig(args.config)

  if (config.mode === 'ts') {
    const { startDev } = await import('@pagesmith/core/ssg')
    const { createContentLayer } = await import('@pagesmith/core')

    // Dynamic import of the TS config
    const userConfig = await import(config.path!)
    const layerConfig = userConfig.default ?? userConfig

    const layer = createContentLayer(layerConfig)
    const cwd = process.cwd()
    const contentDir = resolve(
      cwd,
      layerConfig.root ?? '',
      layerConfig.collections ? 'content' : '',
    )
    const outDir = resolve(cwd, 'dist')

    await startDev({
      outDir,
      contentDir,
      watchDirs: [contentDir],
      port: args.port,
      open: args.open,
      buildFn: async () => {
        const { buildSite } = await import('@pagesmith/core/ssg')
        await buildSite(layer, {
          outDir,
          template: (entry, rendered) => rendered.html,
        })
        layer.invalidateAll()
      },
    })
    return
  }

  if (config.mode === 'json5') {
    // Delegate to @pagesmith/docs if available
    try {
      const docs = await import('@pagesmith/docs')
      if (docs.startDev) {
        await docs.startDev({ configPath: config.path, port: args.port, open: args.open })
        return
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') throw err
    }
    console.error('JSON5 config detected but @pagesmith/docs is not installed.')
    console.error('Install it with: npm install @pagesmith/docs')
    process.exit(1)
  }

  console.error('No pagesmith config found. Create pagesmith.config.ts or pagesmith.config.json5.')
  printHelp()
  process.exit(1)
}

async function runBuild(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)
  const config = await detectConfig(args.config)

  if (config.mode === 'ts') {
    const userConfig = await import(config.path!)
    const layerConfig = userConfig.default ?? userConfig
    const outDir = args.outDir ?? resolve(process.cwd(), layerConfig.outDir ?? 'dist')
    const basePath = args.basePath ?? layerConfig.basePath ?? ''

    // SSG config with layouts — delegate to the full SSG builder
    if (layerConfig.layouts) {
      const { buildFullSite } = await import('@pagesmith/core/ssg')
      await buildFullSite(layerConfig, { outDir, basePath })
      return
    }

    // Content-layer config with collections
    const { createContentLayer } = await import('@pagesmith/core')
    const { buildSite } = await import('@pagesmith/core/ssg')

    const layer = createContentLayer(layerConfig)
    const result = await buildSite(layer, {
      outDir,
      basePath,
      template: (entry, rendered) => rendered.html,
    })
    console.log(`Built ${result.pages} pages to ${outDir}`)
    return
  }

  if (config.mode === 'json5') {
    try {
      const docs = await import('@pagesmith/docs')
      if (docs.build) {
        await docs.build({
          configPath: config.path,
          outDir: args.outDir,
          basePath: args.basePath,
        })
        return
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') throw err
    }
    console.error('JSON5 config detected but @pagesmith/docs is not installed.')
    console.error('Install it with: npm install @pagesmith/docs')
    process.exit(1)
  }

  console.error('No pagesmith config found. Create pagesmith.config.ts or pagesmith.config.json5.')
  printHelp()
  process.exit(1)
}

async function runPreview(argv: string[]): Promise<void> {
  const args = parseServerArgs(argv)

  const { startPreview } = await import('@pagesmith/core/ssg')
  await startPreview({
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

  if (command === 'create') {
    await runCreate(rest)
    return
  }

  if (command === 'convert') {
    await runConvert(rest)
    return
  }

  if (command === 'toc') {
    await runToc(rest)
    return
  }

  if (command === 'diagrams') {
    await runDiagrams(rest)
    return
  }

  if (command === 'ai') {
    await runAi(rest)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
