#!/usr/bin/env node

import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'gh-pages')

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, '.nojekyll'), '')

// Copy shared font assets to gh-pages/assets/
const coreFontsDir = join(process.cwd(), 'packages/core/assets/fonts')
const sharedAssetsDir = join(outDir, 'assets')
mkdirSync(join(sharedAssetsDir, 'fonts'), { recursive: true })
cpSync(coreFontsDir, join(sharedAssetsDir, 'fonts'), { recursive: true })
cpSync(join(process.cwd(), 'packages/core/assets/fonts.css'), join(sharedAssetsDir, 'fonts.css'))

// Copy llms text files to gh-pages root
for (const file of ['llms.txt', 'llms-full.txt']) {
  const src = join(process.cwd(), file)
  if (existsSync(src)) {
    copyFileSync(src, join(outDir, file))
    console.log(`Copied ${file} → gh-pages/${file}`)
  }
}

console.log(`gh-pages scaffold written to ${outDir}`)
console.log(`Shared font assets copied to ${sharedAssetsDir}`)
