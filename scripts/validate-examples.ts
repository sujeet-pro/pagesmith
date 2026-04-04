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

const contentLayerExamples: Example[] = [
  'with-vanilla-ejs',
  'with-vanilla-hbs',
  'with-react',
  'with-solid',
  'with-svelte',
].map((name: string) => ({
  name,
  buildCmd: 'vp run build',
  outDir: '../../gh-pages/examples',
}))

const docsExamples: Example[] = ['blog-site', 'doc-site'].map((name: string) => ({
  name,
  buildCmd: 'vp run build',
  outDir: '../../gh-pages/examples',
}))

const examples: Example[] = [...contentLayerExamples, ...docsExamples]

async function validateExample(example: Example): Promise<Result> {
  const dir: string = join(root, 'examples', example.name)
  const outDir: string = resolveExampleOutDir(example.name)

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

function resolveExampleOutDir(name: string): string {
  const map: Record<string, string> = {
    'blog-site': join(root, 'gh-pages/examples/blog-site'),
    'doc-site': join(root, 'gh-pages/examples/doc-site'),
    'with-vanilla-ejs': join(root, 'gh-pages/examples/vanilla-ejs'),
    'with-vanilla-hbs': join(root, 'gh-pages/examples/vanilla-hbs'),
    'with-react': join(root, 'gh-pages/examples/react'),
    'with-solid': join(root, 'gh-pages/examples/solid'),
    'with-svelte': join(root, 'gh-pages/examples/svelte'),
  }

  return map[name]
}
