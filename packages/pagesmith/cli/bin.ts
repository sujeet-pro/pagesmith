#!/usr/bin/env node

/**
 * Pagesmith CLI.
 *
 * Commands:
 *   pagesmith build [--parallel] [--validate] [--out <dir>]
 *   pagesmith dev [--port <n>]
 *   pagesmith preview [--port <n>]
 *   pagesmith diagrams [--force] [--watch] [--file <path>] [--type <mermaid|excalidraw>]
 *   pagesmith validate [--only <names>] [--watch]
 *   pagesmith check-orphans
 */

import { resolve, } from 'path'
import { resolveConfig, } from '../src/config'

const args = process.argv.slice(2,)
const command = args[0]

function getFlag(name: string,): boolean {
  return args.includes(`--${name}`,)
}

function getArg(name: string,): string | undefined {
  const idx = args.indexOf(`--${name}`,)
  return idx >= 0 ? args[idx + 1] : undefined
}

async function main() {
  switch (command) {
    case 'build': {
      const { build, } = await import('../src/build',)
      const config = resolveConfig({
        outDir: getArg('out',),
        parallel: getFlag('parallel',),
      },)

      if (getFlag('validate',)) {
        const { runValidation, } = await import('../src/validators',)
        const result = await runValidation()
        if (result.errors > 0) {
          process.exit(1,)
        }
      }

      // Render diagrams before build
      const { renderDiagrams, } = await import('../src/diagrams',)
      await renderDiagrams({ contentDir: config.contentDir, },)

      await build(config,)
      break
    }

    case 'dev': {
      const { startDev, } = await import('../src/server',)
      const port = getArg('port',) ? parseInt(getArg('port',)!, 10,) : undefined
      const config = resolveConfig({ outDir: './dev', },)
      await startDev(config, { port, },)
      break
    }

    case 'preview': {
      const { startPreview, } = await import('../src/server',)
      const port = getArg('port',) ? parseInt(getArg('port',)!, 10,) : undefined
      await startPreview({ port, },)
      break
    }

    case 'diagrams': {
      const { renderDiagrams, watchDiagrams, } = await import('../src/diagrams',)
      const config = resolveConfig()
      await renderDiagrams({
        contentDir: config.contentDir,
        force: getFlag('force',),
        file: getArg('file',),
        type: getArg('type',) as 'mermaid' | 'excalidraw' | undefined,
      },)
      if (getFlag('watch',)) watchDiagrams(config.contentDir,)
      break
    }

    case 'validate': {
      const { runValidation, } = await import('../src/validators',)
      const only = getArg('only',)
      const result = await runValidation({
        validators: only ? only.split(',',) : undefined,
      },)
      process.exit(result.errors > 0 ? 1 : 0,)
    }

    case 'check-orphans': {
      const { runValidation, } = await import('../src/validators',)
      const result = await runValidation({ validators: ['orphans',], },)
      process.exit(result.errors > 0 ? 1 : 0,)
    }

    default:
      console.log(`pagesmith — static site generator

Commands:
  build      Build the site
  dev        Start dev server with hot reload
  preview    Preview the built site
  diagrams   Render diagrams
  validate   Validate content
  check-orphans  Find unreferenced assets

Options:
  build --parallel    Use worker pool for rendering
  build --validate    Run validation before building
  build --out <dir>   Output directory (default: dist)
  dev --port <n>      Dev server port (default: 3000)
  diagrams --force    Force re-render all diagrams
  diagrams --watch    Watch for diagram changes
  validate --only <names>  Run specific validators (comma-separated)
`,)
      if (command && command !== '--help' && command !== '-h') {
        process.exit(1,)
      }
  }
}

main().catch((err,) => {
  console.error(err,)
  process.exit(1,)
},)
