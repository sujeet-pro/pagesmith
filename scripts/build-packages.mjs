#!/usr/bin/env node

import { execSync } from 'child_process'
import { join } from 'path'

const root = process.cwd()
const packages = ['core', 'docs']

for (const pkg of packages) {
  console.log(`\n> vp pack (${pkg})`)
  execSync('vp pack', {
    cwd: join(root, 'packages', pkg),
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${join(root, 'node_modules/.bin')}:${process.env.PATH}`,
    },
  })
}
