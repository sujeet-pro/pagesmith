#!/usr/bin/env -S node --strip-types --no-warnings

import { spawn } from 'child_process'
import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, relative } from 'path'

const rootDir = process.cwd()
const validateOnly = process.argv.includes('--validate-only')
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--validate-only')
const diagramsSegment = join('diagrams', '')
const diagramSvgPattern = /(?:-light|-dark)\.svg$/
const skippedDirs = new Set([
  '.git',
  '.next',
  '.diagramkit',
  'dist',
  'gh-pages',
  'node_modules',
  'out',
])

function collectDiagramSvgFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory() && skippedDirs.has(entry.name)) {
      continue
    }

    const entryPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectDiagramSvgFiles(entryPath))
      continue
    }

    if (diagramSvgPattern.test(entry.name) && entryPath.includes(diagramsSegment)) {
      files.push(entryPath)
    }
  }

  return files
}

function validateDiagramSvgs(): void {
  const diagramSvgFiles = collectDiagramSvgFiles(rootDir)
  const invalidFiles = diagramSvgFiles.filter((filePath) =>
    readFileSync(filePath, 'utf-8').includes('<foreignObject'),
  )

  if (invalidFiles.length === 0) {
    console.log(`Validated ${diagramSvgFiles.length} diagram SVGs: no foreignObject output found.`)
    return
  }

  console.error(
    '\nDiagram validation failed. The following SVG assets still contain <foreignObject>:',
  )

  for (const filePath of invalidFiles) {
    console.error(`  - ${relative(rootDir, filePath)}`)
  }

  console.error(
    '\nThese SVGs can render as standalone documents but fail when embedded via <img> in browsers or webviews.',
  )
  console.error(
    "For Mermaid flowcharts, add `%%{init: {'htmlLabels': false}}%%` at the top of the source and re-render.",
  )
  process.exit(1)
}

async function run(): Promise<void> {
  if (!validateOnly) {
    const diagramkitBin = fileURLToPath(
      new URL('../node_modules/diagramkit/dist/cli/bin.mjs', import.meta.url),
    )

    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, [diagramkitBin, 'render', '.', ...forwardedArgs], {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit',
      })

      child.once('error', reject)
      child.once('exit', (code) => {
        if (code === 0) {
          resolve()
          return
        }

        reject(new Error(`diagramkit render exited with code ${code ?? 'unknown'}`))
      })
    })
  }

  validateDiagramSvgs()
}

await run()
