#!/usr/bin/env node

/**
 * Preview a specific example.
 * Usage: node --experimental-strip-types scripts/preview-example.ts <example-name>
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

const exampleName = process.argv[2]

if (!exampleName) {
  console.error('Usage: node --experimental-strip-types scripts/preview-example.ts <example-name>')
  console.error('')
  console.error('Available examples:')
  console.error(
    '  Content layer: with-vanilla-ejs, with-vanilla-hbs, with-react, with-solid, with-svelte',
  )
  console.error('  SSG:           blog-site, doc-site')
  process.exit(1)
}

const exampleDir = join(ROOT, 'examples', exampleName)

if (!existsSync(exampleDir)) {
  console.error(`Example not found: ${exampleDir}`)
  process.exit(1)
}

const ssgExamples = ['blog-site', 'doc-site']
const isSsg = ssgExamples.includes(exampleName)

const previewCmd = isSsg ? 'pagesmith preview' : 'vp run preview'

console.log(`> preview ${exampleName} (${isSsg ? 'SSG' : 'content layer'})`)
console.log(`> ${previewCmd}`)

execSync(previewCmd, {
  cwd: exampleDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${join(ROOT, 'node_modules/.bin')}:${process.env.PATH}`,
  },
})
