/**
 * CSS and JS bundling utilities.
 *
 * CSS is bundled via LightningCSS (through @pagesmith/core's buildCss).
 * JS is bundled via rolldown (dynamically imported to keep it optional).
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildCss as buildCssCore } from '../css'

/**
 * Bundle a CSS entry file into the output directory.
 *
 * Uses LightningCSS for bundling with modern browser targets.
 */
export async function bundleCss(
  entry: string,
  outDir: string,
  options?: { minify?: boolean; fileName?: string },
): Promise<void> {
  if (!existsSync(entry)) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  const css = buildCssCore(entry, { minify: options?.minify ?? true })
  const fileName = options?.fileName ?? 'style.css'
  writeFileSync(join(assetsDir, fileName), css)
}

/**
 * Bundle a JS entry file into the output directory using rolldown.
 *
 * Rolldown is dynamically imported so it's only loaded when needed.
 */
export async function bundleJs(
  entry: string,
  outDir: string,
  options?: { minify?: boolean; fileName?: string },
): Promise<void> {
  if (!existsSync(entry)) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  const { build } = await import('rolldown')
  await build({
    input: entry,
    output: {
      dir: assetsDir,
      entryFileNames: options?.fileName ?? 'main.js',
      format: 'esm',
      minify: options?.minify ?? true,
    },
    platform: 'browser',
    logLevel: 'warn',
  })
}
