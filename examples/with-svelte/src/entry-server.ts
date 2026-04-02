import { render as renderSvelte } from 'svelte/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import App from './App.svelte'
import {
  blogEntries,
  buildNavEntries,
  escapeHtml,
  estimateReadTime,
  groupBySeries,
  guideEntries,
  leafSlug,
  normalizeRoute,
  pageEntries,
  routeFor,
  toIso,
} from './site'

function renderDocument(props: {
  title: string
  description?: string
  headHtml?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
}) {
  const { title, description, headHtml, basePath, cssPath, jsPath, searchEnabled, bodyHtml } = props
  const base = basePath.replace(/\/+$/, '')

  return `<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    ${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ''}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    ${description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : ''}
    <link rel="icon" href="${base}/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${base}/assets/fonts.css" />
    <link rel="stylesheet" href="${cssPath}" />
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
    ${searchEnabled ? '<noscript><style>.doc-search-trigger{display:none!important}</style></noscript>' : ''}
    ${headHtml ?? ''}
  </head>
  <body>
    ${bodyHtml}
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}

export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...blogEntries.map((entry) => routeFor(entry, 'blog')))

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
  const blogNavEntries = buildNavEntries(blogEntries, config.base, 'blog')
  const guideGroups = groupBySeries(config.base)
  const firstGuideUrl = guideNavEntries[0]?.url ?? `${config.base}/guide`
  const firstBlogUrl = blogNavEntries[0]?.url ?? `${config.base}/blog`

  const sharedProps = {
    currentPath: routePath,
    basePath: config.base,
    firstGuideUrl,
    firstBlogUrl,
    searchEnabled: config.searchEnabled,
    guideEntries: guideNavEntries,
    blogEntries: blogNavEntries,
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
    const blogEntry = blogEntries.find((entry) => routeFor(entry, 'blog') === routePath)
    const aboutEntry = pageEntries.find((entry) => routeFor(entry, 'pages') === routePath)
    const currentEntry = guideEntry ?? blogEntry ?? aboutEntry

    if (currentEntry && routePath !== '/') {
      title = `${currentEntry.frontmatter.title} - Pagesmith + Svelte`
      description = currentEntry.frontmatter.description ?? description
      appProps = {
        ...sharedProps,
        pageKind: 'page',
        pageTitle: currentEntry.frontmatter.title,
        pageDescription: currentEntry.frontmatter.description,
        pageContent: currentEntry.html,
        pageHeadings: currentEntry.headings,
        pageDate: toIso(currentEntry.frontmatter.date),
        pageReadTime: estimateReadTime(currentEntry.html),
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
