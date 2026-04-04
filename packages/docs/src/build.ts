import { copyPublicFiles } from '@pagesmith/core/assets'
import { buildCss } from '@pagesmith/core/css'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs'
import { basename, dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import {
  getThemeRuntimeEntry,
  getThemeStylesEntry,
  reportConfigIssues,
  resolveDocsConfig,
  validateConfig,
  type DocsBuildOptions,
  type ResolvedDocsConfig,
} from './config.js'
import { collectContentAssets, type DocsPage } from './content.js'
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

function copyDirRecursive(srcDir: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true })
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

function copyMappedAssets(config: ResolvedDocsConfig): void {
  for (const [outputPath, sources] of config.assets) {
    // Normalize output path: "/" → outDir root, "/api" → outDir/api
    const destDir = outputPath === '/' ? config.outDir : join(config.outDir, outputPath)
    mkdirSync(destDir, { recursive: true })

    for (const sourcePath of sources) {
      if (!existsSync(sourcePath)) continue

      const stat = statSync(sourcePath)
      if (stat.isDirectory()) {
        copyDirRecursive(sourcePath, join(destDir, basename(sourcePath)))
      } else {
        copyFileSync(sourcePath, join(destDir, basename(sourcePath)))
      }
    }
  }
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

function generateSitemap(pages: DocsPage[], config: ResolvedDocsConfig): string {
  const base = `${config.origin}${config.basePath}`
  const urls = pages
    .filter((p) => !p.frontmatter.draft)
    .map((p) => {
      const loc = p.isHome ? `${base}/` : `${base}${p.routePath}/`
      return `  <url><loc>${loc}</loc></url>`
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n')
}

const LLMS_FILES = ['llms.txt', 'llms-full.txt']

function copyLlmsFiles(config: ResolvedDocsConfig): void {
  for (const fileName of LLMS_FILES) {
    const sourcePath = join(config.rootDir, fileName)
    const destPath = join(config.outDir, fileName)
    if (existsSync(sourcePath) && !existsSync(destPath)) {
      copyFileSync(sourcePath, destPath)
    }
  }
}

export async function build(options: DocsBuildOptions = {}): Promise<void> {
  const startTime = performance.now()
  const config = resolveDocsConfig(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })

  // Validate config and report issues
  const issues = validateConfig(config)
  if (issues.length > 0) {
    console.log()
    const hasErrors = reportConfigIssues(issues)
    console.log()
    if (hasErrors) {
      throw new Error('Config validation failed — fix the errors above before building.')
    }
  }

  if (existsSync(config.outDir)) {
    rmSync(config.outDir, { recursive: true, force: true })
  }
  mkdirSync(config.outDir, { recursive: true })

  const contentAssets = collectContentAssets(config.contentDir)

  await bundleThemeAssets(config)
  const { pages } = await renderDocs(config)
  copyPublicAssets(config)
  copyMappedAssets(config)
  copyContentAssetsToOutput(config.outDir, contentAssets)

  // Copy favicon to output if not already present (e.g. bundled default not in public/)
  if (config.favicon) {
    const faviconDest = join(config.outDir, basename(config.favicon))
    if (!existsSync(faviconDest)) {
      copyFileSync(config.favicon, faviconDest)
    }
  }

  // Auto-copy llms.txt convention files from project root
  copyLlmsFiles(config)

  // Auto-generate .nojekyll for GitHub Pages compatibility
  writeFileSync(join(config.outDir, '.nojekyll'), '')

  // Auto-generate sitemap.xml when origin is configured
  if (config.sitemap && config.origin !== 'https://example.com') {
    writeFileSync(join(config.outDir, 'sitemap.xml'), generateSitemap(pages, config))
  }

  // Auto-generate robots.txt if not already present (from publicDir or assets)
  const robotsPath = join(config.outDir, 'robots.txt')
  if (!existsSync(robotsPath)) {
    const hasSitemap = config.sitemap && config.origin !== 'https://example.com'
    const sitemapLine = hasSitemap
      ? `\nSitemap: ${config.origin}${config.basePath}/sitemap.xml`
      : ''
    writeFileSync(robotsPath, `User-agent: *\nAllow: /${sitemapLine}\n`)
  }

  // Build summary
  const duration = ((performance.now() - startTime) / 1000).toFixed(1)
  const sectionCount = new Set(pages.map((p) => p.section).filter(Boolean)).size
  console.log()
  console.log(`  Built ${pages.length} pages in ${sectionCount} sections (${duration}s)`)

  if (config.search.enabled) {
    console.log()
    try {
      await runPagefind(config.outDir, config.search.pagefindFlags)
    } catch (error) {
      console.warn(`\x1b[33m⚠ Pagefind indexing failed — search will not be available.\x1b[0m`)
      console.warn(`  ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Rebuild content only — skips theme bundling and Pagefind indexing.
 * Used by the dev server for fast content-only rebuilds.
 */
export async function rebuildContent(options: DocsBuildOptions = {}): Promise<void> {
  const config = resolveDocsConfig(options.configPath, {
    outDir: options.outDir,
    basePath: options.basePath,
  })

  const contentAssets = collectContentAssets(config.contentDir)

  await renderDocs(config)
  copyPublicAssets(config)
  copyMappedAssets(config)
  copyContentAssetsToOutput(config.outDir, contentAssets)

  if (config.favicon) {
    const faviconDest = join(config.outDir, basename(config.favicon))
    if (!existsSync(faviconDest)) {
      copyFileSync(config.favicon, faviconDest)
    }
  }
}
