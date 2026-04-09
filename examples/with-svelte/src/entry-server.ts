// ── Boilerplate: shared across all framework examples ──
// Helper utilities (route normalization, nav building, HTML escaping, etc.) live
// in ./site.ts and are framework-agnostic. They can be reused as-is.

import { render as renderSvelte } from 'svelte/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import { renderDocumentShell } from '@pagesmith/core/ssg-utils'
import App from './App.svelte'
import {
  featuresEntries,
  buildNavEntries,
  estimateReadTime,
  groupBySeries,
  guideEntries,
  leafSlug,
  normalizeRoute,
  pageEntries,
  routeFor,
  toIso,
} from './site'

const renderDocument = renderDocumentShell

// ── Layout components ──
// Svelte layout components live in .svelte files (App.svelte, etc.).
// The route/render logic below wires props into those components.

export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...featuresEntries.map((entry) => routeFor(entry, 'features')))

  const aboutPage = pageEntries.find((entry) => leafSlug(entry.contentSlug, 'pages') === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}

export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  const routePath = (() => {
    const normalized = normalizeRoute(url, config.base)
    return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
  })()

  const guideNavEntries = buildNavEntries(guideEntries, config.base, 'guide')
  const featuresNavEntries = buildNavEntries(featuresEntries, config.base, 'features')
  const guideGroups = groupBySeries(config.base)
  const firstGuideUrl = guideNavEntries[0]?.url ?? `${config.base}/guide`
  const firstFeaturesUrl = featuresNavEntries[0]?.url ?? `${config.base}/features`

  const sharedProps = {
    currentPath: routePath,
    basePath: config.base,
    firstGuideUrl,
    firstFeaturesUrl,
    searchEnabled: config.searchEnabled,
    guideEntries: guideNavEntries,
    featuresEntries: featuresNavEntries,
    guideGroups,
  }

  let title = 'Pagesmith + Svelte'
  let description =
    'A content-driven static site rendered with Svelte and powered by the Pagesmith Vite content plugin.'
  let appProps: Record<string, unknown> = {
    ...sharedProps,
    pageKind: 'home',
  }

  if (routePath === '/404') {
    title = 'Page Not Found - Pagesmith + Svelte'
    description = 'The page you requested could not be found.'
    appProps = {
      ...sharedProps,
      pageKind: 'not-found',
    }
  } else {
    const guideEntry = guideEntries.find((entry) => routeFor(entry, 'guide') === routePath)
    const featuresEntry = featuresEntries.find((entry) => routeFor(entry, 'features') === routePath)
    const aboutEntry = pageEntries.find((entry) => routeFor(entry, 'pages') === routePath)
    const currentEntry = guideEntry ?? featuresEntry ?? aboutEntry

    if (currentEntry && routePath !== '/') {
      title = `${currentEntry.frontmatter.title} - Pagesmith + Svelte`
      description = currentEntry.frontmatter.description ?? description

      let pagePrev: { title: string; url: string } | undefined
      let pageNext: { title: string; url: string } | undefined
      let pageEditUrl: string | undefined

      const githubEditBase =
        'https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-svelte/content'

      if (guideEntry) {
        const i = guideEntries.indexOf(guideEntry)
        if (i > 0) {
          const e = guideEntries[i - 1]!
          pagePrev = {
            title: e.frontmatter.title,
            url: `${config.base}/guide/${leafSlug(e.contentSlug, 'guide')}`,
          }
        }
        if (i >= 0 && i < guideEntries.length - 1) {
          const e = guideEntries[i + 1]!
          pageNext = {
            title: e.frontmatter.title,
            url: `${config.base}/guide/${leafSlug(e.contentSlug, 'guide')}`,
          }
        }
        pageEditUrl = `${githubEditBase}/${guideEntry.contentSlug}.md`
      } else if (featuresEntry) {
        const i = featuresEntries.indexOf(featuresEntry)
        if (i > 0) {
          const e = featuresEntries[i - 1]!
          pagePrev = {
            title: e.frontmatter.title,
            url: `${config.base}/features/${leafSlug(e.contentSlug, 'features')}`,
          }
        }
        if (i >= 0 && i < featuresEntries.length - 1) {
          const e = featuresEntries[i + 1]!
          pageNext = {
            title: e.frontmatter.title,
            url: `${config.base}/features/${leafSlug(e.contentSlug, 'features')}`,
          }
        }
        pageEditUrl = `${githubEditBase}/${featuresEntry.contentSlug}.md`
      } else if (aboutEntry) {
        pageEditUrl = `${githubEditBase}/${aboutEntry.contentSlug}.md`
      }

      appProps = {
        ...sharedProps,
        pageKind: 'page',
        pageTitle: currentEntry.frontmatter.title,
        pageDescription: currentEntry.frontmatter.description,
        pageContent: currentEntry.html,
        pageHeadings: currentEntry.headings,
        pageDate: toIso(currentEntry.frontmatter.date),
        pageReadTime: estimateReadTime(currentEntry.html),
        pagePrev,
        pageNext,
        pageEditUrl,
      }
    }
  }

  const rendered = renderSvelte(App, { props: appProps })

  return renderDocument({
    title,
    description,
    headHtml: rendered.head,
    basePath: config.base,
    cssPath: config.cssPath,
    jsPath: config.jsPath,
    searchEnabled: config.searchEnabled,
    bodyHtml: rendered.body,
  })
}
