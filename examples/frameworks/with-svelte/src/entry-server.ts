/**
 * SSG entry: Node runs this at build (and dev middleware) to map URLs → HTML strings.
 * Flow: virtual content (see site.ts) → props → svelte/server render → renderDocumentShell,
 * which wraps Svelte output in the shared document (FOUC script, assets, optional Pagefind).
 */
import { render as renderSvelte } from 'svelte/server'
import type { SsgRenderConfig } from '@pagesmith/site/vite'
import { renderDocumentShell } from '@pagesmith/site/ssg-utils'
import App from './App.svelte'
import {
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

export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))

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
  const guideGroups = groupBySeries(config.base)
  const firstGuideUrl = guideNavEntries[0]?.url ?? `${config.base}/guide`
  const kitchenSinkEntry = guideEntries.find(
    (entry) => leafSlug(entry.contentSlug, 'guide') === 'kitchen-sink',
  )
  const kitchenSinkUrl = kitchenSinkEntry
    ? `${config.base}/guide/${leafSlug(kitchenSinkEntry.contentSlug, 'guide')}`
    : firstGuideUrl

  const sharedProps = {
    currentPath: routePath,
    basePath: config.base,
    firstGuideUrl,
    kitchenSinkUrl,
    searchEnabled: config.searchEnabled,
    guideEntries: guideNavEntries,
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
    const aboutEntry = pageEntries.find((entry) => routeFor(entry, 'pages') === routePath)
    const currentEntry = guideEntry ?? aboutEntry

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
