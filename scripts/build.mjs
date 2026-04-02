#!/usr/bin/env node

import { cpSync, mkdirSync, writeFileSync } from 'fs'
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

console.log(`gh-pages scaffold written to ${outDir}`)
console.log(`Shared font assets copied to ${sharedAssetsDir}`)
