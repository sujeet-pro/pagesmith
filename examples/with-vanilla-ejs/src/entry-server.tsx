/**
 * SSR entry for the EJS example.
 *
 * Exports `getRoutes()` and `render()` for the pagesmithSsg Vite plugin.
 * All content loading, sorting, and layout rendering lives here.
 */

import { createContentLayer } from '@pagesmith/core'
import ejs from 'ejs'
import { readFileSync } from 'fs'
import { join } from 'path'
// @ts-expect-error -- the example intentionally keeps the content config as .mjs
import contentConfig from '../content.config.mjs'
import type { SsgRenderConfig } from '@pagesmith/core/vite'

const { guide, blog, pages } = contentConfig as Record<string, any>

// ── Content layer (created once, reused across renders) ──

let layer: ReturnType<typeof createContentLayer>
let layerRoot: string
function getLayer(root: string) {
  if (!layer || layerRoot !== root) {
    layerRoot = root
    layer = createContentLayer({ collections: { guide, blog, pages }, root })
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
  const allBlog = await l.getCollection('blog')
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
  const renderedBlog = await renderAll(allBlog)
  const renderedPages = await renderAll(allPages)

  const sortedGuide = [...renderedGuide].sort((a, b) => {
    const so = (a.entry.data.seriesOrder ?? 99) - (b.entry.data.seriesOrder ?? 99)
    if (so !== 0) return so
    return a.entry.data.date.getTime() - b.entry.data.date.getTime()
  })

  const sortedBlog = [...renderedBlog].sort(
    (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime(),
  )

  return { sortedGuide, sortedBlog, renderedPages }
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
  const { sortedGuide, sortedBlog, renderedPages } = await loadContent(config.root)
  const routes = ['/']
  for (const item of sortedGuide) routes.push(`/guide/${item.entry.slug}`)
  for (const item of sortedBlog) routes.push(`/blog/${item.entry.slug}`)
  if (renderedPages.find((p) => p.entry.slug === 'about')) routes.push('/about')
  return routes
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const { base, root, cssPath, jsPath, searchEnabled } = config
  const { sortedGuide, sortedBlog, renderedPages } = await loadContent(root)

  const guideGroups = groupBySeries(sortedGuide)
  const css = readFileSync(join(root, 'src/theme.css'), 'utf-8')
  const basePath = base.endsWith('/') ? base : base + '/'

  const sidebarData = {
    guideGroups,
    blogEntries: sortedBlog.map((e) => ({ title: e.entry.data.title, slug: e.entry.slug })),
    firstGuideSlug: sortedGuide[0]?.entry.slug ?? '',
    firstBlogSlug: sortedBlog[0]?.entry.slug ?? '',
  }

  const shared = { basePath, css, js: '', formatDate, sidebar: sidebarData }

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
      sortedBlog: sortedBlog.map((e) => ({
        title: e.entry.data.title,
        description: e.entry.data.description,
        date: e.entry.data.date,
        tags: e.entry.data.tags,
        slug: e.entry.slug,
      })),
      basePath,
      formatDate,
      firstGuideSlug: sortedGuide[0]?.entry.slug ?? '',
      firstBlogSlug: sortedBlog[0]?.entry.slug ?? '',
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
    const item = sortedGuide.find((e) => e.entry.slug === guideMatch[1])
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
      })
    }
  }

  // Blog pages
  const blogMatch = routePath.match(/^\/blog\/(.+)$/)
  if (blogMatch) {
    const item = sortedBlog.find((e) => e.entry.slug === blogMatch[1])
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
        activePath: `/blog/${item.entry.slug}`,
        aside: renderTocAside(item.headings),
        isHome: false,
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
      })
    }
  }

  // 404
  return '<main class="doc-not-found"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></main>'
}
