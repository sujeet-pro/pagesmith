#!/usr/bin/env -S node --strip-types --no-warnings

import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const outDir: string = join(process.cwd(), 'gh-pages')

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, '.nojekyll'), '')

// Copy shared font assets to gh-pages/assets/
const coreFontsDir: string = join(process.cwd(), 'packages/core/assets/fonts')
const sharedAssetsDir: string = join(outDir, 'assets')
mkdirSync(join(sharedAssetsDir, 'fonts'), { recursive: true })
cpSync(coreFontsDir, join(sharedAssetsDir, 'fonts'), { recursive: true })
cpSync(join(process.cwd(), 'packages/core/assets/fonts.css'), join(sharedAssetsDir, 'fonts.css'))

// Copy llms text files to gh-pages root
for (const file of ['llms.txt', 'llms-full.txt']) {
  const src: string = join(process.cwd(), file)
  if (existsSync(src)) {
    copyFileSync(src, join(outDir, file))
    console.log(`Copied ${file} → gh-pages/${file}`)
  }
}

// Copy package-level llms files to hosted paths.
interface LlmsTarget {
  srcDir: string
  outDir: string
}

const packageLlmsTargets: LlmsTarget[] = [
  { srcDir: join(process.cwd(), 'packages/core/docs'), outDir: join(outDir, 'packages/core') },
  { srcDir: join(process.cwd(), 'packages/docs/docs'), outDir: join(outDir, 'packages/docs') },
]

for (const target of packageLlmsTargets) {
  mkdirSync(target.outDir, { recursive: true })
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const src: string = join(target.srcDir, file)
    if (existsSync(src)) {
      copyFileSync(src, join(target.outDir, file))
      console.log(`Copied ${src} → ${join(target.outDir, file)}`)
    }
  }
}

console.log(`gh-pages scaffold written to ${outDir}`)
console.log(`Shared font assets copied to ${sharedAssetsDir}`)
