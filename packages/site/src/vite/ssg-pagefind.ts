/**
 * Pagefind search indexing for the SSG plugin.
 *
 * Runs the Pagefind CLI to index the generated static site output,
 * producing the search index used by the docs theme.
 */

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Run Pagefind indexing on the built site output directory.
 *
 * Resolves the Pagefind binary from the installed package and invokes it
 * via a child process. Logs a warning and continues if Pagefind is not
 * installed.
 */
export async function runPagefindIndexing(outDir: string): Promise<void> {
  console.log('SSG: Indexing with Pagefind...')
  try {
    const pagefindMain = fileURLToPath(import.meta.resolve('pagefind'))
    const pagefindBin = join(dirname(pagefindMain), '..', 'lib', 'runner', 'bin.cjs')
    const { execFileSync } = await import('child_process')
    execFileSync(process.execPath, [pagefindBin, '--site', outDir], { stdio: 'inherit' })
  } catch {
    console.warn('SSG: Pagefind not found, skipping search indexing')
  }
}
