#!/usr/bin/env -S node --strip-types --no-warnings

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const root: string = process.cwd()
const packagesDir = join(root, 'packages')
const packages: string[] = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(packagesDir, name, 'package.json')))

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
