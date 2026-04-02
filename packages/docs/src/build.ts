import { copyPublicFiles } from '@pagesmith/core/assets'
import { buildCss } from '@pagesmith/core/css'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  getThemeRuntimeEntry,
  getThemeStylesEntry,
  resolveDocsConfig,
  type DocsBuildOptions,
  type ResolvedDocsConfig,
} from './config.js'
import { collectContentAssets } from './content.js'
import { renderDocs } from './render.js'

async function bundleThemeAssets(config: ResolvedDocsConfig): Promise<void> {
  const assetsDir = join(config.outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  const css = buildCss(getThemeStylesEntry(), { minify: true })
  writeFileSync(join(assetsDir, 'style.css'), css)

  const { build } = await import('rolldown')

  await build({
    input: getThemeRuntimeEntry(),
    output: {
      dir: assetsDir,
      entryFileNames: 'main.js',
      format: 'esm',
      minify: true,
    },
    platform: 'browser',
    logLevel: 'warn',
  })

  // Copy bundled font files to assets/fonts/
  const corePkgDir = dirname(fileURLToPath(import.meta.resolve('@pagesmith/core/package.json')))
  const coreFontsDir = join(corePkgDir, 'assets', 'fonts')
  const outFontsDir = join(assetsDir, 'fonts')
  mkdirSync(outFontsDir, { recursive: true })
  for (const file of readdirSync(coreFontsDir)) {
    if (file.endsWith('.woff2')) {
      copyFileSync(join(coreFontsDir, file), join(outFontsDir, file))
    }
  }
}

function copyPublicAssets(config: ResolvedDocsConfig): void {
  copyPublicFiles(config.publicDir, config.outDir)
}

function copyContentAssetsToOutput(outDir: string, assets: Map<string, string>): void {
  if (assets.size === 0) return

  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  for (const [fileName, sourcePath] of assets) {
    copyFileSync(sourcePath, join(assetsDir, fileName))
  }
}

async function runPagefind(outDir: string, extraFlags: string[] = []): Promise<void> {
  // Resolve pagefind's main entry via import.meta.resolve (works with exports-only packages)
  const { fileURLToPath } = await import('url')
  const mainUrl = import.meta.resolve('pagefind')
  const mainPath = fileURLToPath(mainUrl)
  const pagefindRoot = join(mainPath, '..', '..')
  const binaryPath = join(pagefindRoot, 'lib', 'runner', 'bin.cjs')

  const { execFileSync } = await import('child_process')
  execFileSync(process.execPath, [binaryPath, '--site', outDir, ...extraFlags], {
    stdio: 'inherit',
  })
}

export async function build(options: DocsBuildOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })

  if (existsSync(config.outDir)) {
    rmSync(config.outDir, { recursive: true, force: true })
  }
  mkdirSync(config.outDir, { recursive: true })

  const contentAssets = collectContentAssets(config.contentDir)

  await bundleThemeAssets(config)
  await renderDocs(config)
  copyPublicAssets(config)
  copyContentAssetsToOutput(config.outDir, contentAssets)

  // Copy favicon to output if not already present (e.g. bundled default not in public/)
  if (config.favicon) {
    const faviconDest = join(config.outDir, basename(config.favicon))
    if (!existsSync(faviconDest)) {
      copyFileSync(config.favicon, faviconDest)
    }
  }

  if (config.search.enabled) {
    await runPagefind(config.outDir, config.search.pagefindFlags)
  }
}
