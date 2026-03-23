#!/usr/bin/env node

import { cpSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const projectName = args[0] || 'my-site'
const template = args.includes('--template')
  ? args[args.indexOf('--template') + 1] || 'minimal'
  : 'minimal'

const dest = resolve(projectName)
const templateDir = join(__dirname, 'templates', template)

console.log(`Creating ${projectName} with template "${template}"...`)

mkdirSync(dest, { recursive: true })
cpSync(templateDir, dest, { recursive: true })

// Write package.json
writeFileSync(
  join(dest, 'package.json'),
  JSON.stringify(
    {
      name: projectName,
      private: true,
      type: 'module',
      scripts: {
        build: 'pagesmith build',
        dev: 'pagesmith dev',
        preview: 'pagesmith preview',
      },
      dependencies: {
        pagesmith: '^0.1.0',
      },
    },
    null,
    2,
  ) + '\n',
)

console.log(`
Done! To get started:

  cd ${projectName}
  npm install
  npx pagesmith dev
`)
