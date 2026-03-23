#!/usr/bin/env node

/**
 * CLI for rendering diagram source files (.mermaid, .excalidraw) to SVGs.
 *
 * Usage:
 *   pagesmith-content diagrams [options] [folder]
 *
 * Options:
 *   --force          Re-render all diagrams, ignoring manifest staleness
 *   --watch          Watch for changes and re-render automatically
 *   --file <path>    Render a single specific file
 *   --type <type>    Filter to "mermaid", "excalidraw", or "drawio" only
 *   -h, --help       Show this help message
 *
 * The default folder is the current working directory. Scans recursively
 * for .mermaid and .excalidraw files and renders them to sibling .diagrams/
 * hidden folders with -light.svg and -dark.svg variants.
 */

import { resolve } from 'path'
import { renderDiagrams, watchDiagrams } from '../src/diagrams/index'

/* ── Arg parsing ── */

interface CliArgs {
  folder: string
  force: boolean
  watch: boolean
  file?: string
  type?: 'mermaid' | 'excalidraw' | 'drawio'
  help: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    folder: process.cwd(),
    force: false,
    watch: false,
    help: false,
  }

  const positional: string[] = []
  let i = 0

  while (i < argv.length) {
    const arg = argv[i]!

    if (arg === '--force' || arg === '-f') {
      args.force = true
    } else if (arg === '--watch' || arg === '-w') {
      args.watch = true
    } else if (arg === '--file') {
      i++
      const val = argv[i]
      if (!val) {
        console.error('Error: --file requires a path argument')
        process.exit(1)
      }
      args.file = resolve(val)
    } else if (arg === '--type' || arg === '-t') {
      i++
      const val = argv[i]
      if (val !== 'mermaid' && val !== 'excalidraw' && val !== 'drawio') {
        console.error('Error: --type must be "mermaid", "excalidraw", or "drawio"')
        process.exit(1)
      }
      args.type = val
    } else if (arg === '-h' || arg === '--help') {
      args.help = true
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`)
      process.exit(1)
    } else {
      positional.push(arg)
    }
    i++
  }

  if (positional.length > 0) {
    args.folder = resolve(positional[0]!)
  }

  return args
}

function printHelp() {
  console.log(
    `
pagesmith-content diagrams — Render .mermaid and .excalidraw files to SVGs

Usage:
  pagesmith-content diagrams [options] [folder]

Options:
  --force, -f         Re-render all diagrams, ignoring staleness
  --watch, -w         Watch for changes and re-render automatically
  --file <path>       Render a single specific file
  --type, -t <type>   Filter to "mermaid", "excalidraw", or "drawio" only
  -h, --help          Show this help message

Folder defaults to the current working directory. Scans recursively for
diagram source files and renders them into sibling .diagrams/ folders.

Output:
  source-dir/flow.mermaid
    -> source-dir/.diagrams/flow-light.svg
    -> source-dir/.diagrams/flow-dark.svg
    -> source-dir/.diagrams/manifest.json
`.trim(),
  )
}

/* ── Main ── */

async function main() {
  // Skip "node" and script path, plus "diagrams" subcommand if present
  const rawArgs = process.argv.slice(2)
  // If first arg is "diagrams", skip it (allows both direct and subcommand invocation)
  const start = rawArgs[0] === 'diagrams' ? 1 : 0
  const args = parseArgs(rawArgs.slice(start))

  if (args.help) {
    printHelp()
    return
  }

  const contentDir = args.folder

  if (args.watch) {
    // Initial render, then watch
    await renderDiagrams({
      contentDir,
      force: args.force,
      type: args.type,
    })

    watchDiagrams({
      contentDir,
      onChange: (file) => {
        console.log(`  Done: ${file}\n`)
      },
    })
  } else {
    await renderDiagrams({
      contentDir,
      force: args.force,
      file: args.file,
      type: args.type,
    })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
