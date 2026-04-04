#!/usr/bin/env -S node --strip-types --no-warnings

import { execSync } from 'child_process'
import { join } from 'path'

const root: string = process.cwd()
const packages: string[] = ['core', 'docs']

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
