#!/usr/bin/env node

import { execSync } from 'child_process'
import { join } from 'path'

const ROOT = process.cwd()
const packages = ['core', 'content', 'pagesmith']

for (const pkg of packages) {
  console.log(`\n> vp pack (${pkg})`)
  execSync('vp pack', {
    cwd: join(ROOT, 'packages', pkg),
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${join(ROOT, 'node_modules/.bin')}:${process.env.PATH}`,
    },
  })
}
