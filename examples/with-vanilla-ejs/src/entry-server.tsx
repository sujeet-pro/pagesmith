/**
 * SSR entry for the EJS example.
 *
 * Exports `getRoutes()` and `render()` for the pagesmithSsg Vite plugin.
 * All content loading, sorting, and layout rendering lives here.
 *
 * Why this file exists: `pagesmithSsg` does not render Markdown itself — it
 * loads this module in dev (middleware SSR) and after the client bundle build
 * (static HTML). You own routing, `createContentLayer` usage, and how HTML is
 * produced (here: EJS). That keeps `@pagesmith/core` as the content/markdown
 * engine while templates stay plain strings.
 */

import { createContentLayer } from '@pagesmith/core'
import ejs from 'ejs'
import { readFileSync } from 'fs'
import { join } from 'path'
// @ts-expect-error -- the example intentionally keeps the content config as .mjs
import contentConfig from '../content.config.mjs'
import type { SsgRenderConfig } from '@pagesmith/site/vite'

const { guide, pages } = contentConfig as Record<string, any>

// ── Content layer (created once per project root) ──
// Why `createContentLayer` here (not `pagesmithContent`): this stack has no
// framework virtual modules — the SSR entry loads collections by name and
// passes rendered HTML into EJS. Same API as other examples, different wiring.

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

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const GITHUB_EDIT_BASE =
  'https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-vanilla-ejs/content'

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

function loadTemplate(root: string, name: string) {
  return readFileSync(join(root, 'templates', `${name}.ejs`), 'utf-8')
}

function renderWithLayout(root: string, body: string, vars: Record<string, any>) {
  const layout = loadTemplate(root, 'layout')
  return ejs.render(layout, { ...vars, body })
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

  // `searchEnabled` / `isDev` come from `SsgRenderConfig` — use them so the
  // layout does not reference Pagefind assets in dev (they are not written yet).
  const shared = {
    basePath,
    cssPath,
    jsPath,
    formatDate,
    sidebar: sidebarData,
    searchEnabled,
    isDev: config.isDev,
  }

  // Strip basePath from URL to get the route path
  let routePath = url
  if (base && routePath.startsWith(base)) {
    routePath = routePath.slice(base.length) || '/'
  }
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1)
  }

  const articleTemplate = loadTemplate(root, 'article')
  const indexTemplate = loadTemplate(root, 'index')
  const aboutTemplate = loadTemplate(root, 'about')

  // Home
  if (routePath === '/') {
    const indexBody = ejs.render(indexTemplate, {
      sortedGuide: sortedGuide.map((e) => ({
        title: e.entry.data.title,
        description: e.entry.data.description,
        slug: e.entry.slug,
      })),
      basePath,
      firstGuideSlug: sortedGuide[0]?.entry.slug ?? '',
      kitchenSinkSlug,
    })
    return renderWithLayout(root, indexBody, {
      ...shared,
      title: 'Pagesmith + EJS',
      activePath: '/',
      aside: '',
      isHome: true,
    })
  }

  // Guide pages
  const guideMatch = routePath.match(/^\/guide\/(.+)$/)
  if (guideMatch) {
    const guideIndex = sortedGuide.findIndex((e) => e.entry.slug === guideMatch[1])
    const item = guideIndex >= 0 ? sortedGuide[guideIndex] : undefined
    if (item) {
      const body = ejs.render(articleTemplate, {
        title: item.entry.data.title,
        date: item.entry.data.date,
        tags: item.entry.data.tags,
        description: item.entry.data.description,
        content: item.html,
        headings: item.headings,
        readTime: item.readTime,
        basePath,
        formatDate,
      })
      return renderWithLayout(root, body, {
        ...shared,
        title: item.entry.data.title,
        activePath: `/guide/${item.entry.slug}`,
        aside: renderTocAside(item.headings),
        isHome: false,
        ...articleNeighbors(sortedGuide, guideIndex, basePath, 'guide'),
        editUrl: editUrlForEntry(item.entry),
        lastUpdated: formatDate(item.entry.data.date),
      })
    }
  }

  // About page
  if (routePath === '/about') {
    const aboutItem = renderedPages.find((p) => p.entry.slug === 'about')
    if (aboutItem) {
      const aboutBody = ejs.render(aboutTemplate, {
        title: aboutItem.entry.data.title,
        content: aboutItem.html,
        basePath,
      })
      return renderWithLayout(root, aboutBody, {
        ...shared,
        title: aboutItem.entry.data.title,
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
