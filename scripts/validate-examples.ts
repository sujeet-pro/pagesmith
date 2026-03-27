#!/usr/bin/env node

/**
 * Validate all examples build successfully and produce output.
 *
 * For each example:
 * 1. Run the build command
 * 2. Verify dist/ output exists and contains index.html
 * 3. Report pass/fail
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

interface ExampleDef {
  name: string
  buildCmd: string
  outDir: string
}

const contentLayerExamples: ExampleDef[] = [
  'with-vanilla-ejs',
  'with-vanilla-hbs',
  'with-react',
  'with-solid',
  'with-svelte',
].map((name) => ({
  name,
  buildCmd: 'vp run build',
  outDir: 'dist',
}))

const ssgExamples: ExampleDef[] = ['blog-site', 'doc-site'].map((name) => ({
  name,
  buildCmd: 'vp run build',
  outDir: 'dist',
}))

const examples = [...contentLayerExamples, ...ssgExamples]

interface Result {
  name: string
  passed: boolean
  error?: string
}

const results: Result[] = []

for (const example of examples) {
  const dir = join(ROOT, 'examples', example.name)
  const outDir = join(dir, example.outDir)

  process.stdout.write(`\n> validate ${example.name} ... `)

  try {
    execSync(example.buildCmd, {
      cwd: dir,
      stdio: 'pipe',
      env: {
        ...process.env,
        PATH: `${join(ROOT, 'node_modules/.bin')}:${process.env.PATH}`,
      },
    })

    if (!existsSync(outDir)) {
      results.push({ name: example.name, passed: false, error: `output dir not found: ${outDir}` })
      process.stdout.write('FAIL (no output dir)\n')
      continue
    }

    const files = readdirSync(outDir, { recursive: true }) as string[]
    const hasIndex = files.some((f) => f === 'index.html' || f.endsWith('/index.html'))

    if (!hasIndex) {
      results.push({ name: example.name, passed: false, error: 'no index.html found in output' })
      process.stdout.write('FAIL (no index.html)\n')
      continue
    }

    results.push({ name: example.name, passed: true })
    process.stdout.write('PASS\n')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.push({ name: example.name, passed: false, error: message })
    process.stdout.write('FAIL (build error)\n')
  }
}

console.log('\n--- Summary ---')
const passed = results.filter((r) => r.passed)
const failed = results.filter((r) => !r.passed)

console.log(`Passed: ${passed.length}/${results.length}`)

if (failed.length > 0) {
  console.log('\nFailed:')
  for (const f of failed) {
    console.log(`  - ${f.name}: ${f.error}`)
  }
  process.exit(1)
}
