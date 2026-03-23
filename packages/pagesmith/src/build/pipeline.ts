/**
 * Build pipeline.
 *
 * Three-phase orchestrator:
 *   Phase 1: Load config, collect content, process markdown, build global index
 *   Phase 2: Render all pages (serial), bundle CSS, bundle runtime JS
 *   Phase 3: Generate tag pages, redirects, sitemap, RSS, agents, hash assets, copy public
 */

import { buildCss } from '@pagesmith/core/css'
import { processMarkdown } from '@pagesmith/core/markdown'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { dirname, extname, join, relative } from 'path'
import type { PageMeta } from '../../schemas'
import type { ProcessedPage } from '../../schemas/build-types'
import { copyPublicFiles, hashAssets } from '../assets'
import { loadAllPageTypeMetas, loadRedirects, loadSiteConfig, type ResolvedConfig } from '../config'
import { collectMdFiles, toSlug } from '../content'
import { generateAgents } from '../generators/agents'
import { generateBrowserconfig } from '../generators/browserconfig'
import { generateManifest } from '../generators/manifest-json'
import { generateNotFoundPage } from '../generators/not-found'
import { generateRedirects } from '../generators/redirects'
import { generateRss } from '../generators/rss'
import { generateSitemap, type SitemapEntry } from '../generators/sitemap'
import { generateTagPages } from '../generators/tags'
import { rehypeAssetTransform } from '../markdown/plugins/rehype-asset-transform'
import { buildGlobalIndex, formatDate } from './indexer'
import { resolveLayout } from './layout-loader'
import { WorkerPool } from './pool'
import { renderPage } from './renderer'

/** Main build function — the 3-phase orchestrator. */
export async function build(config: ResolvedConfig): Promise<void> {
  const start = performance.now()
  const { contentDir, layoutsDirs, publicDir, outDir } = config

  const siteConfig = loadSiteConfig(contentDir)
  const pageTypeMetas = loadAllPageTypeMetas(contentDir, siteConfig.pageTypes)
  const redirectsConfig = loadRedirects(contentDir)

  if (existsSync(outDir)) rmSync(outDir, { recursive: true })
  mkdirSync(outDir, { recursive: true })

  // ── Phase 1: Process markdown and build global index ──

  const mdFiles = collectMdFiles(contentDir)
  const pages: PageMeta[] = []
  const sitemapEntries: SitemapEntry[] = []
  const processed: ProcessedPage[] = []

  for (const filePath of mdFiles) {
    const raw = readFileSync(filePath, 'utf-8')
    const slug = toSlug(filePath, contentDir)
    const mdConfig = {
      ...(siteConfig.markdown || {}),
      rehypePlugins: [
        ...(siteConfig.markdown?.rehypePlugins || []),
        [rehypeAssetTransform, { contentDir: dirname(filePath) }] as const,
      ],
    }
    const result = await processMarkdown(raw, mdConfig)

    // Compute read time (~200 wpm)
    const plainText = result.html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wordCount = plainText.split(' ').filter(Boolean).length
    result.frontmatter.readTime = Math.max(1, Math.ceil(wordCount / 200))

    if (result.frontmatter.draft) continue

    const layoutName = resolveLayout(slug, result.frontmatter, siteConfig, pageTypeMetas)

    pages.push({
      slug,
      filePath: relative(contentDir, filePath),
      frontmatter: result.frontmatter,
    })

    sitemapEntries.push({
      slug,
      lastmod: formatDate(result.frontmatter.lastUpdatedDate ?? result.frontmatter.lastUpdatedOn),
    })

    processed.push({
      slug,
      html: result.html,
      headings: result.headings,
      frontmatter: result.frontmatter,
      layoutName,
    })
  }

  const globalIndex = buildGlobalIndex(siteConfig, pages, pageTypeMetas)

  // ── Phase 2: Render all pages, bundle CSS, bundle runtime JS ──

  const primaryLayoutsDir = layoutsDirs[0]

  if (config.parallel) {
    const pool = new WorkerPool()
    try {
      await pool.renderPages(processed, globalIndex, outDir, primaryLayoutsDir)
    } finally {
      pool.dispose()
    }
  } else {
    for (const page of processed) {
      await renderPage(page, globalIndex, outDir, primaryLayoutsDir)
    }
  }

  // Ensure dist/assets/ exists for CSS + JS output
  const assetsDir = join(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  // Build CSS (LightningCSS bundling from entry point) → dist/assets/
  const cssEntry = config.css.entries[0]
  if (cssEntry && existsSync(cssEntry)) {
    const css = buildCss(cssEntry, { minify: config.css.minify })
    writeFileSync(join(assetsDir, 'style.css'), css)
  }

  // Bundle runtime JS → dist/assets/
  const runtimeEntry = config.runtime.entries[0]
  if (runtimeEntry && existsSync(runtimeEntry)) {
    const { build: rolldownBuild } = await import('rolldown')
    await rolldownBuild({
      input: runtimeEntry,
      output: {
        dir: assetsDir,
        entryFileNames: 'main.js',
        format: 'esm',
        minify: config.runtime.minify,
      },
      platform: 'browser',
      logLevel: 'warn',
    })
  }

  // ── Phase 3: Generate tag pages, redirects, sitemap, RSS, agents, hash assets, copy public ──

  const tagPageCount = await generateTagPages(
    globalIndex,
    outDir,
    primaryLayoutsDir,
    sitemapEntries,
    {
      tagListingLayout: config.generators.tagListingLayout,
      tagIndexLayout: config.generators.tagIndexLayout,
    },
  )

  generateRedirects(redirectsConfig, outDir)

  // Generate 404 page
  await generateNotFoundPage(
    siteConfig,
    outDir,
    primaryLayoutsDir,
    config.generators.notFoundLayout,
  )

  // Copy fonts from public/ → dist/assets/ (before hashing, so they get hashed)
  const fontsDir = join(publicDir, 'fonts')
  if (existsSync(fontsDir)) {
    for (const entry of readdirSync(fontsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        copyFileSync(join(fontsDir, entry.name), join(assetsDir, entry.name))
      }
    }
  }

  // Hash pre-existing assets + copy/hash content assets referenced in HTML
  hashAssets(outDir, contentDir)

  // Copy public/ files to dist root (unhashed, after hash step)
  // Skip fonts/ since they were already copied to assets/
  if (existsSync(publicDir)) {
    copyPublicFiles(publicDir, outDir)
  }

  // Generate sitemap
  const siteUrl = siteConfig.origin || 'https://example.com'
  const sitemap = generateSitemap(sitemapEntries, siteUrl)
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap)

  // Generate RSS feed
  generateRss(siteConfig, pages, outDir)

  // Generate agents files
  generateAgents(siteConfig, pages, outDir)

  // Generate PWA manifest and browserconfig
  generateManifest(siteConfig, outDir)
  generateBrowserconfig(siteConfig, outDir)

  const elapsed = (performance.now() - start).toFixed(0)
  console.log(`Built ${processed.length} pages + ${tagPageCount} tag pages in ${elapsed}ms`)
}
