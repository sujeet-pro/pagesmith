#!/usr/bin/env -S node --strip-types --no-warnings

import { exec } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface Example {
  name: string
  buildCmd: string
  outDir: string
}

interface Result {
  name: string
  passed: boolean
  error?: string
}

const root: string = process.cwd()

const examples: Example[] = [
  { name: 'blog-site', buildCmd: 'npm run build', outDir: 'gh-pages/examples/blog-site' },
  { name: 'doc-site', buildCmd: 'npm run build', outDir: 'gh-pages/examples/doc-site' },
  { name: 'with-vanilla-ejs', buildCmd: 'npm run build', outDir: 'gh-pages/examples/vanilla-ejs' },
  { name: 'with-vanilla-hbs', buildCmd: 'npm run build', outDir: 'gh-pages/examples/vanilla-hbs' },
  { name: 'with-react', buildCmd: 'npm run build', outDir: 'gh-pages/examples/react' },
  { name: 'with-solid', buildCmd: 'npm run build', outDir: 'gh-pages/examples/solid' },
  { name: 'with-svelte', buildCmd: 'npm run build', outDir: 'gh-pages/examples/svelte' },
]

async function validateExample(example: Example): Promise<Result> {
  const dir: string = join(root, 'examples', example.name)
  const outDir: string = join(root, example.outDir)

  try {
    await execAsync(example.buildCmd, {
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${join(root, 'node_modules/.bin')}:${process.env.PATH}`,
      },
    })

    if (!existsSync(outDir)) {
      return { name: example.name, passed: false, error: `output dir not found: ${outDir}` }
    }

    const files = readdirSync(outDir, { recursive: true }) as string[]
    const hasIndex: boolean = files.some(
      (file: string) => file === 'index.html' || file.endsWith('/index.html'),
    )

    if (!hasIndex) {
      return { name: example.name, passed: false, error: 'no index.html found in output' }
    }

    return { name: example.name, passed: true }
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error)
    return { name: example.name, passed: false, error: message }
  }
}

console.log(`\nValidating ${examples.length} examples in parallel...\n`)

const results: Result[] = await Promise.all(examples.map(validateExample))

for (const result of results) {
  const status = result.passed ? 'PASS' : `FAIL (${result.error})`
  console.log(`  ${result.name} ... ${status}`)
}

console.log('\n--- Summary ---')
const passed: Result[] = results.filter((result: Result) => result.passed)
const failed: Result[] = results.filter((result: Result) => !result.passed)

console.log(`Passed: ${passed.length}/${results.length}`)

if (failed.length > 0) {
  console.log('\nFailed:')
  for (const failure of failed) {
    console.log(`  - ${failure.name}: ${failure.error}`)
  }
  process.exit(1)
}
