/**
 * SSG builders — static site generation from content.
 *
 * - buildSite(): minimal builder for content-layer configs with collections
 * - buildFullSite(): layout-based builder for configs with layouts, CSS, and runtime entries
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, extname, join, relative, resolve } from 'path'
import type { ContentLayer } from '../content-layer'
import type { ContentEntry, RenderedContent } from '../entry'

export type BuildSiteOptions = {
  /** Output directory */
  outDir: string
  /** Template function that wraps rendered content in a full HTML page */
  template: (entry: ContentEntry<any>, rendered: RenderedContent) => string
  /** Collections to include (defaults to all) */
  collections?: string[]
  /** Base URL path prefix (e.g. '/blog') */
  basePath?: string
}

/** Build a static site from a content layer. */
export async function buildSite(
  layer: ContentLayer,
  options: BuildSiteOptions,
): Promise<{ pages: number }> {
  const { outDir, template, basePath = '' } = options
  const collections = options.collections ?? layer.getCollectionNames()

  let pages = 0

  for (const name of collections) {
    const entries = await layer.getCollection(name)

    for (const entry of entries) {
      const rendered = await entry.render()
      const html = template(entry, rendered)

      // Determine output path
      const slug = entry.slug === '/' ? 'index' : entry.slug
      const outPath = join(outDir, basePath, slug, 'index.html')
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, html)
      pages++
    }
  }

  return { pages }
}

// ── Full site builder (layout-based SSG config) ──

export type FullSiteConfig = {
  contentDir?: string
  outDir?: string
  basePath?: string
  css?: { entries: string[]; minify?: boolean }
  runtime?: { entries: string[]; minify?: boolean }
  layouts?: Record<string, () => Promise<any>>
}

type FullSiteBuildOptions = {
  outDir: string
  basePath: string
}

function collectMarkdown(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdown(full))
    } else if (entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

function toContentSlug(filePath: string, contentDir: string): string {
  let slug = relative(contentDir, filePath).replace(/\\/g, '/')
  const ext = extname(slug)
  if (ext) slug = slug.slice(0, -ext.length)
  if (slug === 'README' || slug === 'index') return '/'
  if (slug.endsWith('/README')) slug = slug.slice(0, -7)
  if (slug.endsWith('/index')) slug = slug.slice(0, -6)
  return slug
}

/**
 * Load a layout module, bundling .tsx files on-the-fly via rolldown
 * since Node cannot natively import JSX.
 */
async function loadLayout(loader: () => Promise<any>): Promise<any> {
  try {
    return await loader()
  } catch (err: unknown) {
    // If Node can't handle the file (e.g. .tsx), bundle it first
    const msg = String((err as Error).message ?? '')
    if (!msg.includes('.tsx')) throw err

    // Extract the file path from the error message
    const match = msg.match(/(?:for|from)\s+(\S+\.tsx)/)
    if (!match) throw err
    const tsxPath = match[1]

    const { build: rolldownBuild } = await import('rolldown')
    const tmpDir = join(resolve('.'), 'node_modules', '.cache', 'pagesmith-layouts')
    mkdirSync(tmpDir, { recursive: true })

    const outFile = join(tmpDir, `${Date.now()}.mjs`)
    await (rolldownBuild as Function)({
      input: tsxPath,
      output: { file: outFile, format: 'esm' },
      platform: 'node',
      external: [/^@pagesmith/, /^node:/],
      logLevel: 'warn',
      moduleTypes: { '.tsx': 'tsx', '.ts': 'ts' },
      oxc: { transform: { jsx: { runtime: 'automatic', importSource: '@pagesmith/core' } } },
    })

    const { pathToFileURL } = await import('url')
    return import(pathToFileURL(outFile).href)
  }
}

/**
 * Build a full site from a layout-based SSG config.
 *
 * Discovers markdown in `contentDir`, processes through the pipeline,
 * applies layout functions, bundles CSS/JS, and writes output.
 */
export async function buildFullSite(
  config: FullSiteConfig,
  options: FullSiteBuildOptions,
): Promise<void> {
  const cwd = process.cwd()
  const contentDir = resolve(cwd, config.contentDir ?? 'content')
  const { outDir, basePath } = options

  mkdirSync(outDir, { recursive: true })

  // ── Bundle CSS ──
  if (config.css?.entries?.length) {
    const { bundleCss } = await import('./bundler')
    for (const entry of config.css.entries) {
      await bundleCss(resolve(cwd, entry), outDir, { minify: config.css.minify })
    }
  }

  // ── Bundle runtime JS ──
  if (config.runtime?.entries?.length) {
    const { bundleJs } = await import('./bundler')
    for (const entry of config.runtime.entries) {
      await bundleJs(resolve(cwd, entry), outDir, { minify: config.runtime.minify })
    }
  }

  // ── Read site config ──
  let siteConfig: Record<string, any> = {}
  const siteJsonPath = join(contentDir, 'site.json5')
  if (existsSync(siteJsonPath)) {
    const JSON5 = (await import('json5')).default
    siteConfig = JSON5.parse(readFileSync(siteJsonPath, 'utf-8'))
  }
  siteConfig.baseUrl = basePath

  // ── Read meta.json5 per section ──
  const sectionMeta = new Map<string, Record<string, any>>()
  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const metaPath = join(contentDir, entry.name, 'meta.json5')
    if (existsSync(metaPath)) {
      const JSON5 = (await import('json5')).default
      sectionMeta.set(entry.name, JSON5.parse(readFileSync(metaPath, 'utf-8')))
    }
  }

  // ── Discover and process markdown ──
  const { processMarkdown } = await import('../markdown')
  const markdownFiles = collectMarkdown(contentDir)
  let pages = 0

  // Collect page metadata for layout props
  const allPages = await Promise.all(
    markdownFiles.map(async (filePath) => {
      const raw = readFileSync(filePath, 'utf-8')
      const result = await processMarkdown(raw)
      const slug = toContentSlug(filePath, contentDir)
      return { filePath, slug, ...result }
    }),
  )

  const pageMetas = allPages.map((p) => ({
    slug: p.slug,
    filePath: p.filePath,
    frontmatter: p.frontmatter,
  }))

  for (const page of allPages) {
    const { slug, html: content, headings, frontmatter } = page
    const section = slug !== '/' && slug.includes('/') ? slug.split('/')[0] : undefined
    const isHome = slug === '/'
    const isSectionIndex = section && !slug.includes('/', section.length + 1)

    // Determine layout name
    let layoutName = frontmatter.layout as string | undefined
    if (!layoutName) {
      if (isHome) {
        layoutName = 'Home'
      } else if (isSectionIndex) {
        layoutName = sectionMeta.get(section!)?.layout ?? 'Listing'
      } else if (section) {
        const meta = sectionMeta.get(section)
        layoutName = meta?.itemLayout ?? meta?.layout ?? 'Page'
      } else {
        layoutName = 'Page'
      }
    }

    const layoutLoader = layoutName ? config.layouts?.[layoutName] : undefined
    if (!layoutLoader) {
      console.warn(`No layout "${layoutName}" for ${slug}, skipping`)
      continue
    }

    const mod = await loadLayout(layoutLoader)
    const layoutFn = mod.default ?? mod[layoutName!]
    if (typeof layoutFn !== 'function') {
      console.warn(`Layout "${layoutName}" did not export a function, skipping ${slug}`)
      continue
    }

    const urlPath = basePath + (slug === '/' ? '/' : `/${slug}/`)
    let output: string
    try {
      output = String(
        layoutFn({
          content,
          frontmatter,
          headings,
          slug: urlPath,
          site: siteConfig,
          pages: pageMetas,
        }),
      )
    } catch (err) {
      console.error(`Error rendering ${slug} with layout "${layoutName}":`, (err as Error).message)
      continue
    }

    const outPath =
      slug === '/' ? join(outDir, 'index.html') : join(outDir, slug, 'index.html')
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, `<!DOCTYPE html>\n${output}`)
    pages++
  }

  console.log(`Built ${pages} pages to ${outDir}`)
}
