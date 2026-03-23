#!/usr/bin/env node

import { execSync } from 'child_process'
import { join } from 'path'

const ROOT = process.cwd()
const examples = [
  'with-vanilla-ejs',
  'with-vanilla-hbs',
  'with-react',
  'with-solid',
  'with-svelte',
  'with-ssg',
]

for (const example of examples) {
  console.log(`\n> vp run build (${example})`)
  execSync('vp run build', {
    cwd: join(ROOT, 'examples', example),
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${join(ROOT, 'node_modules/.bin')}:${process.env.PATH}`,
    },
  })
}
