#!/usr/bin/env node

/**
 * @pagesmith/core CLI.
 *
 * Commands:
 *   pagesmith-core convert <file.md> [options]
 *   pagesmith-core toc <file.md|file.html>
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): boolean {
  return args.includes(`--${name}`) || args.includes(`--no-${name}`)
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1]
  // Short flags
  const shortMap: Record<string, string> = { o: 'output', m: 'mode' }
  const short = Object.entries(shortMap).find(([, v]) => v === name)?.[0]
  if (short) {
    const shortIdx = args.indexOf(`-${short}`)
    if (shortIdx >= 0 && shortIdx + 1 < args.length) return args[shortIdx + 1]
  }
  return undefined
}

async function main() {
  switch (command) {
    case 'convert': {
      const file = args[1]
      if (!file) {
        console.error('Usage: pagesmith-core convert <file.md> [options]')
        process.exit(1)
      }

      const { convert } = await import('../src/index.js')

      const input = readFileSync(resolve(file), 'utf-8')
      const mode = (getArg('mode') || getArg('m') || 'full') as 'full' | 'fragment'
      const cssMode = (getArg('css') || 'inline') as 'inline' | 'reference' | 'none'
      const jsMode = (getArg('js') || 'inline') as 'inline' | 'reference' | 'none'
      const noToc = hasFlag('no-toc')
      const title = getArg('title')

      const result = await convert(input, {
        mode,
        css: cssMode,
        js: jsMode,
        noToc,
      })

      if (title) {
        result.frontmatter.title = title
      }

      const output = getArg('output') || getArg('o')
      if (output) {
        writeFileSync(resolve(output), result.html)
        console.log(`Written to ${output}`)
      } else {
        process.stdout.write(result.html)
      }

      if (hasFlag('watch')) {
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
      break
    }

    case 'toc': {
      const file = args[1]
      if (!file) {
        console.error('Usage: pagesmith-core toc <file.md|file.html>')
        process.exit(1)
      }

      const raw = readFileSync(resolve(file), 'utf-8')

      if (file.endsWith('.html')) {
        const { extractToc } = await import('../src/index.js')
        const toc = extractToc(raw)
        console.log(JSON.stringify(toc, null, 2))
      } else {
        // Markdown file — process it first
        const { convert } = await import('../src/index.js')
        const result = await convert(raw, { mode: 'fragment' })
        console.log(JSON.stringify(result.toc, null, 2))
      }
      break
    }

    default:
      console.log(`pagesmith-core — standalone markdown-to-HTML engine

Commands:
  convert <file.md>     Convert markdown to HTML
  toc <file>            Extract TOC as JSON

Convert options:
  -o, --output <path>   Write to file (default: stdout)
  -m, --mode <mode>     full = complete HTML, fragment = content only (default: full)
  --css <mode>          inline | reference | none (default: inline)
  --js <mode>           inline | reference | none (default: inline)
  --no-toc              Omit TOC sidebar
  --title <title>       Override frontmatter title
  -w, --watch           Watch and rebuild on change
`)
      if (command && command !== '--help' && command !== '-h') {
        process.exit(1)
      }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
