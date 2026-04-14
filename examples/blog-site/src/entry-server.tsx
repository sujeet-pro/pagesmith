/**
 * SSG entry for pagesmithSsg: routing and render contract.
 *
 * Content layer setup lives in content.ts, JSX components in components.tsx.
 */
import { h } from '@pagesmith/site/jsx-runtime'
import type { SsgRenderConfig } from '@pagesmith/site/vite'

import {
  buildLayer,
  buildNavEntries,
  getTime,
  groupBySeries,
  normalizeRoute,
  renderEntries,
  routeFor,
  toIso,
  type RenderedEntry,
} from './content'
import { ExampleFooter, HomeBody, PageBody, SidebarNav, renderDocument } from './components'

// ── Data loading ──

async function loadSite(config: SsgRenderConfig) {
  const layer = buildLayer(config.root)

  const guideRaw = await layer.getCollection('guide')
  const pagesRaw = await layer.getCollection('pages')

  const guideEntries = (await renderEntries(guideRaw, 'guide')).sort((left, right) => {
    const orderDelta = (left.data.seriesOrder ?? 99) - (right.data.seriesOrder ?? 99)
    if (orderDelta !== 0) return orderDelta
    return getTime(left.data.date) - getTime(right.data.date)
  })

  const pageEntries = await renderEntries(pagesRaw, 'pages')

  return { guideEntries, pageEntries }
}

// ── Exports (pagesmithSsg contract) ──

export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { guideEntries, pageEntries } = await loadSite(config)

  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry)))

  const aboutPage = pageEntries.find((entry) => entry.slug === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage))
  }

  return routes
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const routePath = (() => {
    const normalized = normalizeRoute(url, config.base)
    return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
  })()

  const { guideEntries, pageEntries } = await loadSite(config)

  const guideNavEntries = buildNavEntries(guideEntries, config.base)
  const guideGroups = groupBySeries(guideEntries, config.base)
  const firstGuideUrl = guideNavEntries[0]?.url ?? `${config.base}/guide`
  const kitchenSinkEntry = guideEntries.find((entry) => entry.slug === 'kitchen-sink')
  const kitchenSinkUrl = kitchenSinkEntry
    ? `${config.base}/guide/${kitchenSinkEntry.slug}`
    : firstGuideUrl

  if (routePath === '/') {
    const sidebarHtml = String(
      <div class="doc-sidebar-section">
        <p class="doc-sidebar-heading">Navigation</p>
        <ul class="doc-sidebar-list">
          <li class="doc-sidebar-item active">
            <a href={`${config.base}/`} class="doc-sidebar-link">
              Home
            </a>
          </li>
          <li class="doc-sidebar-item">
            <a href={firstGuideUrl} class="doc-sidebar-link">
              Guide
            </a>
          </li>
        </ul>
      </div>,
    )
    const bodyHtml = String(
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        kitchenSinkUrl={kitchenSinkUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
      />,
    )

    return renderDocument({
      title: 'Pagesmith + Site JSX',
      description:
        'A content-driven static site using @pagesmith/site -- no framework, no virtual modules.',
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  if (routePath === '/404') {
    return renderDocument({
      title: 'Page Not Found - Pagesmith + Site JSX',
      description: 'The page you requested could not be found.',
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml:
        '<main class="doc-home"><section class="doc-home-section"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></section></main>',
    })
  }

  const guideEntry = guideEntries.find((entry) => routeFor(entry) === routePath)
  if (guideEntry) {
    const sidebarHtml = String(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={true}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
      />,
    )
    const bodyHtml = String(
      <PageBody
        title={guideEntry.data.title}
        content={guideEntry.html}
        headings={guideEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        date={toIso(guideEntry.data.date)}
        readTime={guideEntry.readTime}
      />,
    )

    return renderDocument({
      title: `${guideEntry.data.title} - Pagesmith + Site JSX`,
      description: guideEntry.data.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  const pageEntry = pageEntries.find((entry) => routeFor(entry) === routePath)
  if (pageEntry) {
    const sidebarHtml = String(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
      />,
    )
    const bodyHtml = String(
      <PageBody
        title={pageEntry.data.title}
        content={pageEntry.html}
        headings={pageEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
      />,
    )

    return renderDocument({
      title: `${pageEntry.data.title} - Pagesmith + Site JSX`,
      description: pageEntry.data.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  return renderDocument({
    title: 'Page Not Found - Pagesmith + Site JSX',
    description: 'The page you requested could not be found.',
    basePath: config.base,
    cssPath: config.cssPath,
    jsPath: config.jsPath,
    searchEnabled: config.searchEnabled,
    bodyHtml:
      '<main class="doc-home"><section class="doc-home-section"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></section></main>',
  })
}
