import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { basename, dirname, join, resolve } from 'path'
import { relative } from 'path'
import type { ResolvedDocsConfig } from './config.js'
import type { DocsPage, DocsSectionMeta, SiteModel } from './content.js'
import { buildBreadcrumbs, loadDocsPages, loadRootMeta, loadSectionMetas } from './content.js'
import { buildSiteModel, getPrevNext, getSitePayload } from './navigation.js'
import DocHome from '../theme/layouts/DocHome'
import DocNotFound from '../theme/layouts/DocNotFound'
import DocPage from '../theme/layouts/DocPage'

type DocsRenderable = (props: any) => unknown

type DocsLayoutRegistry = Record<string, DocsRenderable>

async function loadUserThemeModule(
  entryPath: string,
  rootDir: string,
): Promise<Record<string, any>> {
  const { build } = await import('rolldown')
  const { pathToFileURL } = await import('url')

  const cacheDir = join(rootDir, 'node_modules', '.cache', 'pagesmith-docs-layouts')
  mkdirSync(cacheDir, { recursive: true })

  // Clean up old cached files before writing a new one
  for (const file of readdirSync(cacheDir)) {
    if (file.endsWith('.mjs')) {
      try {
        rmSync(join(cacheDir, file))
      } catch {
        // Ignore errors from concurrent cleanup
      }
    }
  }

  // Use content-hash-based filename for stability
  const entryContent = readFileSync(entryPath, 'utf-8')
  const contentHash = createHash('md5').update(entryContent).digest('hex').slice(0, 12)
  const safeBase = basename(entryPath)
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
  const outFile = join(cacheDir, `${safeBase}-${contentHash}.mjs`)

  // Skip rebuild if cached output already exists
  if (!existsSync(outFile)) {
    const rolldownBuild = build as any

    await rolldownBuild({
      input: entryPath,
      output: {
        file: outFile,
        format: 'esm',
      },
      platform: 'node',
      logLevel: 'warn',
      external: [/^node:/, /^@pagesmith\//],
      moduleTypes: {
        '.ts': 'ts',
        '.tsx': 'tsx',
      },
    })
  }

  return import(`${pathToFileURL(outFile).href}?t=${Date.now()}`) as Promise<Record<string, any>>
}

async function resolveDocsLayout(
  name: string,
  config: ResolvedDocsConfig,
  fallback?: DocsRenderable,
): Promise<DocsRenderable> {
  const overridePath = config.theme?.layouts?.[name]
  if (!overridePath) {
    if (fallback) return fallback
    throw new Error(
      `Theme layout "${name}" is referenced in meta.json5 but not registered in theme.layouts config`,
    )
  }

  const absolutePath = resolve(config.rootDir, overridePath)
  const module = await loadUserThemeModule(absolutePath, config.rootDir)

  const knownExports: Record<string, string[]> = {
    home: ['default', 'DocHome', 'Home'],
    page: ['default', 'DocPage', 'Page'],
    notFound: ['default', 'DocNotFound', 'NotFound'],
  }
  const exportNames = knownExports[name] ?? ['default', name]

  for (const exportName of exportNames) {
    const candidate = module[exportName]
    if (typeof candidate === 'function') {
      return candidate as DocsRenderable
    }
  }

  throw new Error(
    `Theme layout "${name}" at ${absolutePath} must export a component as default or one of: ${exportNames.join(', ')}`,
  )
}

async function resolveDocsLayouts(
  config: ResolvedDocsConfig,
  sectionMetas?: Map<string, DocsSectionMeta>,
): Promise<DocsLayoutRegistry> {
  const registry: DocsLayoutRegistry = {
    home: await resolveDocsLayout('home', config, DocHome),
    page: await resolveDocsLayout('page', config, DocPage),
    notFound: await resolveDocsLayout('notFound', config, DocNotFound),
  }

  // Collect unique layout names from section metas
  if (sectionMetas) {
    const extraNames = new Set<string>()
    for (const meta of sectionMetas.values()) {
      if (meta.layout && !registry[meta.layout]) extraNames.add(meta.layout)
      if (meta.itemLayout && !registry[meta.itemLayout]) extraNames.add(meta.itemLayout)
    }
    for (const name of extraNames) {
      registry[name] = await resolveDocsLayout(name, config)
    }
  }

  return registry
}

function writeHtml(outDir: string, routePath: string, html: string): void {
  const outputPath =
    routePath === '/' ? join(outDir, 'index.html') : join(outDir, routePath.slice(1), 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `<!DOCTYPE html>\n${html}`)
}

export async function renderDocs(
  config: ResolvedDocsConfig,
): Promise<{ pages: DocsPage[]; model: SiteModel }> {
  const rootMeta = loadRootMeta(config.contentDir)
  const sectionMetas = loadSectionMetas(config.contentDir)
  const pages = await loadDocsPages(config, sectionMetas)
  const model = buildSiteModel(config, pages, rootMeta, sectionMetas)
  const site = getSitePayload(config, model)
  const layouts = await resolveDocsLayouts(config, sectionMetas)

  const base = config.basePath

  console.log(`  Rendering ${pages.length} pages...`)

  // Build edit link URL helper
  const buildEditUrl = config.editLink
    ? (sourcePath: string) => {
        const relPath = relative(config.rootDir, sourcePath)
        return `${config.editLink!.editPattern}/${relPath}`
      }
    : undefined

  for (const page of pages) {
    const urlPath = `${base}${page.routePath}`

    if (page.isHome) {
      // Prefix internal hero action links with basePath
      const frontmatter = { ...page.frontmatter }
      if (frontmatter.hero?.actions) {
        frontmatter.hero = {
          ...frontmatter.hero,
          actions: frontmatter.hero.actions.map((a: any) => ({
            ...a,
            link:
              typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
          })),
        }
      }
      const homeActions = Array.isArray(frontmatter.actions) ? frontmatter.actions : undefined
      if (homeActions) {
        frontmatter.actions = homeActions.map((a: any) => ({
          ...a,
          link: typeof a.link === 'string' && a.link.startsWith('/') ? `${base}${a.link}` : a.link,
        }))
      }

      const layout = layouts[page.layoutName] ?? layouts.home
      const output = layout({
        content: page.html,
        frontmatter,
        headings: page.headings,
        slug: urlPath,
        site,
      })
      writeHtml(config.outDir, page.routePath, String(output))
      continue
    }

    const sidebarSections = page.section ? model.sidebarBySection.get(page.section) : undefined
    const { prev, next } = getPrevNext(sidebarSections, urlPath)
    const breadcrumbs = buildBreadcrumbs(page.contentSlug, page.title, base)
    const editUrl = buildEditUrl ? buildEditUrl(page.sourcePath) : undefined
    const layout = layouts[page.layoutName] ?? layouts.page
    const output = layout({
      content: page.html,
      frontmatter: page.frontmatter,
      headings: page.headings,
      slug: urlPath,
      site,
      sidebarSections,
      prev,
      next,
      breadcrumbs,
      editUrl,
      editLabel: config.editLink?.label,
      lastUpdated: page.lastUpdated,
    })
    writeHtml(config.outDir, page.routePath, String(output))
  }

  const notFound = layouts.notFound({
    content: '',
    frontmatter: {
      title: 'Page not found',
      description: 'The page you requested could not be found.',
    },
    headings: [],
    slug: `${base}/404`,
    site,
  })
  const notFoundHtml = `<!DOCTYPE html>\n${String(notFound)}`
  writeHtml(config.outDir, '/404', String(notFound))
  // Also write 404.html at root for GitHub Pages
  writeFileSync(join(config.outDir, '404.html'), notFoundHtml)

  return { pages, model }
}
