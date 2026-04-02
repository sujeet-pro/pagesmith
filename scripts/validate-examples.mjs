#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

const contentLayerExamples = [
  'with-vanilla-ejs',
  'with-vanilla-hbs',
  'with-react',
  'with-solid',
  'with-svelte',
].map((name) => ({
  name,
  buildCmd: 'vp run build',
  outDir: '../../gh-pages/examples',
}))

const docsExamples = ['blog-site', 'doc-site'].map((name) => ({
  name,
  buildCmd: 'vp run build',
  outDir: '../../gh-pages/examples',
}))

const examples = [...contentLayerExamples, ...docsExamples]
const results = []

for (const example of examples) {
  const dir = join(root, 'examples', example.name)
  const outDir = resolveExampleOutDir(example.name)

  process.stdout.write(`\n> validate ${example.name} ... `)

  try {
    execSync(example.buildCmd, {
      cwd: dir,
      stdio: 'pipe',
      env: {
        ...process.env,
        PATH: `${join(root, 'node_modules/.bin')}:${process.env.PATH}`,
      },
    })

    if (!existsSync(outDir)) {
      results.push({ name: example.name, passed: false, error: `output dir not found: ${outDir}` })
      process.stdout.write('FAIL (no output dir)\n')
      continue
    }

    const files = readdirSync(outDir, { recursive: true })
    const hasIndex = files.some((file) => file === 'index.html' || file.endsWith('/index.html'))

    if (!hasIndex) {
      results.push({ name: example.name, passed: false, error: 'no index.html found in output' })
      process.stdout.write('FAIL (no index.html)\n')
      continue
    }

    results.push({ name: example.name, passed: true })
    process.stdout.write('PASS\n')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({ name: example.name, passed: false, error: message })
    process.stdout.write('FAIL (build error)\n')
  }
}

console.log('\n--- Summary ---')
const passed = results.filter((result) => result.passed)
const failed = results.filter((result) => !result.passed)

console.log(`Passed: ${passed.length}/${results.length}`)

if (failed.length > 0) {
  console.log('\nFailed:')
  for (const failure of failed) {
    console.log(`  - ${failure.name}: ${failure.error}`)
  }
  process.exit(1)
}

function resolveExampleOutDir(name) {
  const map = {
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
