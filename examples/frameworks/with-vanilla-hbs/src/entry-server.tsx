/**
 * SSR entry for the Handlebars example — this is the integration seam for @pagesmith/site + SSG.
 *
 * - pagesmithSsg imports this module and calls `getRoutes` / `render` (no virtual content modules).
 * - `createContentLayer` loads markdown from disk using `content.config.mjs` schemas.
 * - Handlebars compiles templates per request in dev so .hbs edits reload; the content layer is cached per root.
 * - Returned strings are full HTML documents consumed as static output in production.
 */

import { createContentLayer } from '@pagesmith/site'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
// @ts-expect-error -- the example intentionally keeps the content config as .mjs
import contentConfig from '../content.config.mjs'
import type { SsgRenderConfig } from '@pagesmith/site/vite'

const { guide, pages } = contentConfig as Record<string, any>

// ── Handlebars helpers (registered once) ──

Handlebars.registerHelper('formatDate', (value: any) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
Handlebars.registerHelper('eq', (left: any, right: any) => left === right)
Handlebars.registerHelper(
  'startsWith',
  (str: any, prefix: any) => typeof str === 'string' && str.startsWith(prefix),
)
Handlebars.registerHelper('or', function (...args: any[]) {
  // Last arg is the Handlebars options object
  args.pop()
  return args.some(Boolean)
})
Handlebars.registerHelper('concat', function (...args: any[]) {
  // Last arg is the Handlebars options object
  args.pop()
  return args.join('')
})

// ── Content layer (created once, reused across renders) ──

let layer: ReturnType<typeof createContentLayer>
let layerRoot: string
function getLayer(root: string) {
  if (!layer || layerRoot !== root) {
    layerRoot = root
    layer = createContentLayer({ collections: { guide, pages }, root })
  }
  return layer
}

// ── Content helpers ──

type RenderedEntry = {
  entry: any
  html: string
  headings: any[]
  readTime: number
}

async function loadContent(root: string) {
  const l = getLayer(root)
  const allGuide = await l.getCollection('guide')
  const allPages = await l.getCollection('pages')

  async function renderAll(entries: any[]): Promise<RenderedEntry[]> {
    const results: RenderedEntry[] = []
    for (const entry of entries) {
      const rendered = await entry.render()
      results.push({ entry, ...rendered })
    }
    return results
  }

  const renderedGuide = await renderAll(allGuide)
  const renderedPages = await renderAll(allPages)

  const sortedGuide = [...renderedGuide].sort((a, b) => {
    const so = (a.entry.data.seriesOrder ?? 99) - (b.entry.data.seriesOrder ?? 99)
    if (so !== 0) return so
    return a.entry.data.date.getTime() - b.entry.data.date.getTime()
  })

  return { sortedGuide, renderedPages }
}

function groupBySeries(entries: RenderedEntry[]) {
  const groups: Array<{ series: string; items: Array<{ title: string; slug: string }> }> = []
  const seen = new Map<string, Array<{ title: string; slug: string }>>()
  for (const e of entries) {
    const s = e.entry.data.series ?? 'Other'
    if (!seen.has(s)) {
      const items: Array<{ title: string; slug: string }> = []
      seen.set(s, items)
      groups.push({ series: s, items })
    }
    seen.get(s)!.push({
      title: e.entry.data.title,
      slug: e.entry.slug,
    })
  }
  return groups
}

// ── Template helpers ──

function renderTocAside(headings: any[]) {
  if (!headings || headings.length === 0) return ''
  const filtered = headings.filter((h: any) => h.depth >= 2 && h.depth <= 3)
  if (filtered.length === 0) return ''
  const items = filtered
    .map(
      (h: any) =>
        `<li class="doc-toc-item depth-${h.depth}"><a href="#${h.slug}">${h.text}</a></li>`,
    )
    .join('\n          ')
  return `<nav class="doc-toc">
  <p class="doc-toc-title">On this page</p>
  <ul class="doc-toc-list">
          ${items}
  </ul>
</nav>`
}

const GITHUB_EDIT_BASE =
  'https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-vanilla-hbs/content'

function formatArticleDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function editUrlForEntry(entry: { collection: string; slug: string }) {
  return `${GITHUB_EDIT_BASE}/${entry.collection}/${entry.slug}.md`
}

function articleNeighbors(
  list: RenderedEntry[],
  index: number,
  basePath: string,
  section: 'guide',
): Record<string, { title: string; url: string } | undefined> {
  const out: Record<string, { title: string; url: string } | undefined> = {}
  if (index > 0) {
    const e = list[index - 1]!.entry
    out.prev = { title: e.data.title, url: `${basePath}${section}/${e.slug}/` }
  }
  if (index < list.length - 1) {
    const e = list[index + 1]!.entry
    out.next = { title: e.data.title, url: `${basePath}${section}/${e.slug}/` }
  }
  return out
}

function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.hbs`), 'utf-8')
}

// ── Route + render API ──

export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { sortedGuide, renderedPages } = await loadContent(config.root)
  const routes = ['/']
  for (const item of sortedGuide) routes.push(`/guide/${item.entry.slug}`)
  if (renderedPages.find((p) => p.entry.slug === 'about')) routes.push('/about')
  return routes
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const { base, root, cssPath, jsPath, searchEnabled } = config
  const { sortedGuide, renderedPages } = await loadContent(root)

  const guideGroups = groupBySeries(sortedGuide)
  const basePath = base.endsWith('/') ? base : base + '/'
  const kitchenSinkSlug =
    sortedGuide.find((entry) => entry.entry.slug === 'kitchen-sink')?.entry.slug ??
    sortedGuide[0]?.entry.slug ??
    ''

  const sidebarData = {
    guideGroups,
    firstGuideSlug: sortedGuide[0]?.entry.slug ?? '',
  }

  const shared = { basePath, cssPath, jsPath, sidebar: sidebarData }

  // Re-register layout each render so template file edits apply without restarting Vite (helpers stay module-scoped).
  Handlebars.registerPartial('layout', loadTemplate(root, 'layout'))

  const articleTemplate = Handlebars.compile(loadTemplate(root, 'article'))
  const indexTemplate = Handlebars.compile(loadTemplate(root, 'index'))
  const aboutTemplate = Handlebars.compile(loadTemplate(root, 'about'))

  // Strip basePath from URL to get the route path
  let routePath = url
  if (base && routePath.startsWith(base)) {
    routePath = routePath.slice(base.length) || '/'
  }
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1)
  }

  // Home
  if (routePath === '/') {
    return indexTemplate({
      ...shared,
      title: 'Pagesmith + Handlebars',
      activePath: '/',
      aside: '',
      isHome: true,
      sortedGuide: sortedGuide.map((e) => ({
        title: e.entry.data.title,
        description: e.entry.data.description,
        slug: e.entry.slug,
      })),
      firstGuideSlug: sortedGuide[0]?.entry.slug ?? '',
      kitchenSinkSlug,
    })
  }

  // Guide pages
  const guideMatch = routePath.match(/^\/guide\/(.+)$/)
  if (guideMatch) {
    const guideIndex = sortedGuide.findIndex((e) => e.entry.slug === guideMatch[1])
    const item = guideIndex >= 0 ? sortedGuide[guideIndex] : undefined
    if (item) {
      const tocHeadings = (item.headings || []).filter((h: any) => h.depth >= 2 && h.depth <= 3)
      return articleTemplate({
        ...shared,
        title: item.entry.data.title,
        date: item.entry.data.date,
        tags: item.entry.data.tags,
        description: item.entry.data.description,
        content: item.html,
        headings: item.headings,
        tocHeadings,
        readTime: item.readTime,
        activePath: `/guide/${item.entry.slug}`,
        aside: renderTocAside(item.headings),
        isHome: false,
        ...articleNeighbors(sortedGuide, guideIndex, basePath, 'guide'),
        editUrl: editUrlForEntry(item.entry),
        lastUpdated: formatArticleDate(item.entry.data.date),
      })
    }
  }

  // About page
  if (routePath === '/about') {
    const aboutItem = renderedPages.find((p) => p.entry.slug === 'about')
    if (aboutItem) {
      return aboutTemplate({
        ...shared,
        title: aboutItem.entry.data.title,
        content: aboutItem.html,
        activePath: '/about',
        aside: renderTocAside(aboutItem.headings),
        isHome: false,
        editUrl: editUrlForEntry(aboutItem.entry),
      })
    }
  }

  // 404
  return '<main class="doc-not-found"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></main>'
}
