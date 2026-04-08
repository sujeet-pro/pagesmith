import { resolve } from 'path'
import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'
import type { ContentEntry } from '@pagesmith/core'
import type { SsgRenderConfig } from '@pagesmith/core/vite'

// ── Types ──

type NavEntry = {
  slug: string
  title: string
  description?: string
  url: string
  date?: string
  tags?: string[]
}

type GuideGroup = {
  series: string
  items: NavEntry[]
}

type RenderedEntry = {
  slug: string
  collection: string
  data: Record<string, any>
  html: string
  headings: Array<{ depth: number; slug: string; text: string }>
  readTime: number
}

// ── Icons ──

const menuIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'
const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

// ── Content Layer ──

function buildLayer(root?: string) {
  const contentRoot = root ? resolve(root) : resolve(import.meta.dirname, '..')

  return createContentLayer(
    defineConfig({
      root: contentRoot,
      collections: {
        guide: defineCollection({
          loader: 'markdown',
          directory: resolve(contentRoot, 'content/guide'),
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            date: z.coerce.date(),
            tags: z.array(z.string()).default([]),
            series: z.string().optional(),
            seriesOrder: z.number().optional(),
          }),
        }),
        features: defineCollection({
          loader: 'markdown',
          directory: resolve(contentRoot, 'content/features'),
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            date: z.coerce.date(),
            tags: z.array(z.string()).default([]),
          }),
        }),
        pages: defineCollection({
          loader: 'markdown',
          directory: resolve(contentRoot, 'content/pages'),
          schema: z.object({
            title: z.string(),
            description: z.string().optional(),
          }),
        }),
      },
    }),
  )
}

// ── Helpers ──

async function renderEntries(
  entries: ContentEntry<any>[],
  collection: string,
): Promise<RenderedEntry[]> {
  const rendered: RenderedEntry[] = []
  for (const entry of entries) {
    const result = await entry.render()
    rendered.push({
      slug: entry.slug,
      collection,
      data: entry.data,
      html: result.html,
      headings: result.headings,
      readTime: result.readTime,
    })
  }
  return rendered
}

function getTime(date: string | Date | undefined): number {
  if (!date) return 0
  return date instanceof Date ? date.getTime() : new Date(date).getTime()
}

function toIso(date: string | Date | undefined): string | undefined {
  if (!date) return undefined
  return (date instanceof Date ? date : new Date(date)).toISOString()
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeRoute(url: string, base: string): string {
  if (!base || !url.startsWith(base)) return url === '' ? '/' : url
  const trimmed = url.slice(base.length)
  if (trimmed === '') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function routeFor(entry: RenderedEntry): string {
  if (entry.collection === 'pages') return `/${entry.slug}`
  return `/${entry.collection}/${entry.slug}`
}

function buildNavEntries(entries: RenderedEntry[], base: string): NavEntry[] {
  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    url: `${base}/${entry.collection}/${entry.slug}`,
    date: toIso(entry.data.date),
    tags: entry.data.tags ?? [],
  }))
}

function groupBySeries(guideEntries: RenderedEntry[], base: string): GuideGroup[] {
  const groups: GuideGroup[] = []
  const seen = new Map<string, NavEntry[]>()

  for (const entry of guideEntries) {
    const series = entry.data.series ?? 'Other'
    if (!seen.has(series)) {
      const items: NavEntry[] = []
      seen.set(series, items)
      groups.push({ series, items })
    }
    seen.get(series)!.push({
      slug: entry.slug,
      title: entry.data.title,
      url: `${base}/guide/${entry.slug}`,
    })
  }

  return groups
}

// ── Components ──

function SidebarNav(props: {
  currentPath: string
  basePath: string
  isGuide: boolean
  isFeatures: boolean
  firstGuideUrl: string
  firstFeaturesUrl: string
  guideGroups: GuideGroup[]
  featuresEntries: NavEntry[]
}) {
  const {
    currentPath,
    basePath,
    isGuide,
    isFeatures,
    firstGuideUrl,
    firstFeaturesUrl,
    guideGroups,
    featuresEntries,
  } = props

  return (
    <Fragment>
      <div class="doc-sidebar-section">
        <p class="doc-sidebar-heading">Navigation</p>
        <ul class="doc-sidebar-list">
          <li class={`doc-sidebar-item${currentPath === '/' ? ' active' : ''}`}>
            <a href={`${basePath}/`} class="doc-sidebar-link">
              Home
            </a>
          </li>
          <li class={`doc-sidebar-item${isGuide ? ' active' : ''}`}>
            <a href={firstGuideUrl} class="doc-sidebar-link">
              Guide
            </a>
          </li>
          <li class={`doc-sidebar-item${isFeatures ? ' active' : ''}`}>
            <a href={firstFeaturesUrl} class="doc-sidebar-link">
              Features
            </a>
          </li>
          <li class={`doc-sidebar-item${currentPath === '/about' ? ' active' : ''}`}>
            <a href={`${basePath}/about`} class="doc-sidebar-link">
              About
            </a>
          </li>
        </ul>
      </div>

      <div class="doc-sidebar-section">
        <p class="doc-sidebar-heading">Guide</p>
        <ul class="doc-sidebar-list">
          {guideGroups.map((group) => (
            <li class="doc-sidebar-item expanded">
              <span
                class="doc-sidebar-link"
                style="font-weight: 500; color: var(--color-text-secondary)"
              >
                {group.series}
              </span>
              <ul class="doc-sidebar-nested">
                {group.items.map((entry) => (
                  <li
                    class={`doc-sidebar-item${currentPath === `/guide/${entry.slug}` ? ' active' : ''}`}
                  >
                    <a href={entry.url} class="doc-sidebar-link">
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div class="doc-sidebar-section">
        <p class="doc-sidebar-heading">Features</p>
        <ul class="doc-sidebar-list">
          {featuresEntries.map((entry) => (
            <li
              class={`doc-sidebar-item${currentPath === `/features/${entry.slug}` ? ' active' : ''}`}
            >
              <a href={entry.url} class="doc-sidebar-link">
                {entry.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  )
}

function SearchTrigger() {
  return (
    <button type="button" class="doc-search-trigger" data-search-trigger="" aria-label="Search">
      <span class="doc-search-icon" innerHTML={searchIcon} />
      <kbd class="doc-search-shortcut">
        <span class="doc-search-shortcut-key">{'\u2318'}</span>K
      </kbd>
    </button>
  )
}

function SiteHeader(props: {
  basePath: string
  currentPath: string
  firstGuideUrl: string
  firstFeaturesUrl: string
  searchEnabled?: boolean
}) {
  const { basePath, currentPath, firstGuideUrl, firstFeaturesUrl, searchEnabled } = props
  const isGuide = currentPath.startsWith('/guide')
  const isFeatures = currentPath.startsWith('/features')

  return (
    <header class="doc-header">
      <div class="doc-header-inner">
        <div class="doc-header-left">
          <button
            type="button"
            class="doc-sidebar-toggle"
            aria-label="Toggle navigation"
            data-sidebar-toggle=""
            innerHTML={menuIcon}
          />
          <a href="/pagesmith/" class="doc-logo">
            Pagesmith
          </a>
        </div>
        <nav class="doc-nav">
          <a href={`${basePath}/`} class={currentPath === '/' ? 'active' : ''}>
            Home
          </a>
          <a href={firstGuideUrl} class={isGuide ? 'active' : ''}>
            Guide
          </a>
          <a href={firstFeaturesUrl} class={isFeatures ? 'active' : ''}>
            Blog
          </a>
        </nav>
        {searchEnabled ? <SearchTrigger /> : null}
      </div>
    </header>
  )
}

function HomeBody(props: {
  basePath: string
  firstGuideUrl: string
  firstFeaturesUrl: string
  searchEnabled?: boolean
  guideEntries: NavEntry[]
  featuresEntries: NavEntry[]
}) {
  const {
    basePath,
    firstGuideUrl,
    firstFeaturesUrl,
    searchEnabled,
    guideEntries,
    featuresEntries,
  } = props

  return (
    <Fragment>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={searchEnabled}
      />
      <main class="doc-home" data-pagefind-body="">
        <section class="doc-home-section doc-hero">
          <h1 class="doc-hero-text">Pagesmith + Core JSX</h1>
          <p class="doc-hero-tagline">
            A content-driven static site using @pagesmith/core directly -- no framework, no virtual
            modules, just the content layer API and the core JSX runtime.
          </p>
          <div class="doc-hero-actions">
            <a href={firstGuideUrl} class="doc-hero-action doc-hero-action-brand">
              Read the Guide
            </a>
            <a href={firstFeaturesUrl} class="doc-hero-action doc-hero-action-alt">
              Browse Features
            </a>
          </div>
        </section>

        <section class="doc-home-section">
          <h2>Markdown Features</h2>
          <ul style="display: flex; flex-direction: column; gap: 1rem">
            {featuresEntries.map((post) => (
              <li style="padding: 1rem 1.25rem; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg)">
                <a href={post.url}>
                  <h3 style="margin: 0; font-size: var(--font-size-lg)">{post.title}</h3>
                </a>
                {post.description ? (
                  <p style="margin: 0.5rem 0 0; color: var(--color-text-muted); font-size: var(--font-size-sm)">
                    {post.description}
                  </p>
                ) : null}
                {post.date ? (
                  <p style="margin: 0.375rem 0 0; font-size: var(--font-size-xs); color: var(--color-text-muted)">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.tags && post.tags.length > 0 ? (
                      <Fragment>
                        {' \u00b7 '}
                        {post.tags.join(', ')}
                      </Fragment>
                    ) : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section class="doc-home-section">
          <h2>Guide</h2>
          <ul style="display: flex; flex-direction: column; gap: 0.75rem">
            {guideEntries.map((entry) => (
              <li>
                <a href={entry.url} style="font-weight: 500">
                  {entry.title}
                </a>
                {entry.description ? (
                  <span style="color: var(--color-text-muted); font-size: var(--font-size-sm)">
                    {' \u2014 '}
                    {entry.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <div class="doc-home-footer">
          <footer class="doc-footer">
            <div class="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/blog-site">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <p class="doc-footer-copyright">
              {'\u00a9'} 2026 Pagesmith {' \u00b7 '} Made with{' '}
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </p>
          </footer>
        </div>
      </main>
    </Fragment>
  )
}

function PageBody(props: {
  title: string
  content: string
  headings: Array<{ depth: number; slug: string; text: string }>
  currentPath: string
  basePath: string
  firstGuideUrl: string
  firstFeaturesUrl: string
  searchEnabled?: boolean
  sidebar: GuideGroup[]
  featuresEntries: NavEntry[]
  date?: string
  readTime?: number
}) {
  const {
    content,
    headings,
    currentPath,
    basePath,
    firstGuideUrl,
    firstFeaturesUrl,
    searchEnabled,
    sidebar,
    featuresEntries,
    date,
    readTime,
  } = props
  const filteredHeadings = headings.filter((heading) => heading.depth === 2 || heading.depth === 3)

  return (
    <Fragment>
      <SiteHeader
        basePath={basePath}
        currentPath={currentPath}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={searchEnabled}
      />
      <div class="doc-layout">
        <aside class="doc-sidebar">
          <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
            <SidebarNav
              currentPath={currentPath}
              basePath={basePath}
              isGuide={currentPath.startsWith('/guide')}
              isFeatures={currentPath.startsWith('/features')}
              firstGuideUrl={firstGuideUrl}
              firstFeaturesUrl={firstFeaturesUrl}
              guideGroups={sidebar}
              featuresEntries={featuresEntries}
            />
          </nav>
        </aside>

        <main class="doc-main" data-pagefind-body="">
          <article>
            {filteredHeadings.length > 0 ? (
              <details class="doc-toc-mobile">
                <summary>On this page</summary>
                <nav class="doc-toc">
                  <ul class="doc-toc-list">
                    {filteredHeadings.map((heading) => (
                      <li class={`doc-toc-item depth-${heading.depth}`}>
                        <a href={`#${heading.slug}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            ) : null}

            {date ? (
              <p
                class="doc-page-meta"
                style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: 1rem"
              >
                <time dateTime={date}>{formatDate(date)}</time>
                {readTime ? (
                  <Fragment>
                    {' \u00b7 '}
                    {readTime} min read
                  </Fragment>
                ) : null}
              </p>
            ) : null}

            <div class="prose" innerHTML={content} />
          </article>

          <footer class="doc-footer">
            <div class="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/blog-site">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <p class="doc-footer-copyright">
              {'\u00a9'} 2026 Pagesmith {' \u00b7 '} Made with{' '}
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </p>
          </footer>
        </main>

        <aside class="doc-aside">
          {filteredHeadings.length > 0 ? (
            <nav class="doc-toc">
              <p class="doc-toc-title">On this page</p>
              <ul class="doc-toc-list">
                {filteredHeadings.map((heading) => (
                  <li class={`doc-toc-item depth-${heading.depth}`}>
                    <a href={`#${heading.slug}`}>{heading.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
    </Fragment>
  )
}

function renderDocument(props: {
  title: string
  description?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
  sidebarHtml?: string
}) {
  const { title, description, basePath, cssPath, jsPath, searchEnabled, bodyHtml, sidebarHtml } =
    props
  const base = basePath.replace(/\/+$/, '')

  const foucScript = `(function(){try{var p=JSON.parse(localStorage.getItem('pagesmith-theme'));if(p){var d=document.documentElement;if(p.colorScheme)d.className=d.className.replace(/color-scheme-\\w+/,'color-scheme-'+p.colorScheme);if(p.theme)d.className=d.className.replace(/theme-[\\w-]+/,'theme-'+p.theme)}}catch(e){}})()`

  return `<html lang="en" class="no-js color-scheme-auto theme-paper">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <script>${foucScript}</script>
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
  </head>
  <body>
    ${bodyHtml}
    ${
      sidebarHtml
        ? `<dialog class="doc-sidebar-modal" id="sidebar-modal">
            <div class="doc-sidebar-modal-backdrop" data-sidebar-close=""></div>
            <div class="doc-sidebar-modal-panel">
              <button type="button" class="doc-sidebar-modal-close" data-sidebar-close="" aria-label="Close navigation">${closeIcon}</button>
              <nav class="doc-sidebar-nav" aria-label="Sidebar navigation">${sidebarHtml}</nav>
            </div>
          </dialog>`
        : ''
    }
    ${
      searchEnabled
        ? `<dialog class="doc-search-modal" id="search-modal" aria-label="Search" data-search-show-images="false" data-search-show-sub-results="true">
            <div class="doc-search-modal-inner">
              <div class="doc-search-modal-header">
                <span class="doc-search-modal-title">Search</span>
                <button type="button" class="doc-search-modal-close" aria-label="Close" data-search-close="">${closeIcon}</button>
              </div>
              <div class="doc-search-modal-body" id="search-container" data-pagefind-search=""></div>
            </div>
          </dialog>`
        : ''
    }
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}

// ── Data loading ──

async function loadSite(config: SsgRenderConfig) {
  const layer = buildLayer(config.root)

  const guideRaw = await layer.getCollection('guide')
  const featuresRaw = await layer.getCollection('features')
  const pagesRaw = await layer.getCollection('pages')

  const guideEntries = (await renderEntries(guideRaw, 'guide')).sort((left, right) => {
    const orderDelta = (left.data.seriesOrder ?? 99) - (right.data.seriesOrder ?? 99)
    if (orderDelta !== 0) return orderDelta
    return getTime(left.data.date) - getTime(right.data.date)
  })

  const featuresEntries = (await renderEntries(featuresRaw, 'features')).sort(
    (left, right) => getTime(right.data.date) - getTime(left.data.date),
  )

  const pageEntries = await renderEntries(pagesRaw, 'pages')

  return { guideEntries, featuresEntries, pageEntries }
}

// ── Exports ──

export async function getRoutes(config: SsgRenderConfig): Promise<string[]> {
  const { guideEntries, featuresEntries, pageEntries } = await loadSite(config)

  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry)))
  routes.push(...featuresEntries.map((entry) => routeFor(entry)))

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

  const { guideEntries, featuresEntries, pageEntries } = await loadSite(config)

  const guideNavEntries = buildNavEntries(guideEntries, config.base)
  const featuresNavEntries = buildNavEntries(featuresEntries, config.base)
  const guideGroups = groupBySeries(guideEntries, config.base)
  const firstGuideUrl = guideNavEntries[0]?.url ?? `${config.base}/guide`
  const firstFeaturesUrl = featuresNavEntries[0]?.url ?? `${config.base}/features`

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
          <li class="doc-sidebar-item">
            <a href={firstFeaturesUrl} class="doc-sidebar-link">
              Features
            </a>
          </li>
        </ul>
      </div>,
    )
    const bodyHtml = String(
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
        featuresEntries={featuresNavEntries}
      />,
    )

    return renderDocument({
      title: 'Pagesmith + Core JSX',
      description:
        'A content-driven static site using @pagesmith/core directly -- no framework, no virtual modules.',
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
      title: 'Page Not Found - Pagesmith + Core JSX',
      description: 'The page you requested could not be found.',
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml:
        '<main class="doc-home"><section class="doc-home-section"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></section></main>',
    })
  }

  // Guide page
  const guideEntry = guideEntries.find((entry) => routeFor(entry) === routePath)
  if (guideEntry) {
    const sidebarHtml = String(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={true}
        isFeatures={false}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
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
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
        date={toIso(guideEntry.data.date)}
        readTime={guideEntry.readTime}
      />,
    )

    return renderDocument({
      title: `${guideEntry.data.title} - Pagesmith + Core JSX`,
      description: guideEntry.data.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  // Features page
  const featuresEntry = featuresEntries.find((entry) => routeFor(entry) === routePath)
  if (featuresEntry) {
    const sidebarHtml = String(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        isFeatures={true}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
      />,
    )
    const bodyHtml = String(
      <PageBody
        title={featuresEntry.data.title}
        content={featuresEntry.html}
        headings={featuresEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
        date={toIso(featuresEntry.data.date)}
        readTime={featuresEntry.readTime}
      />,
    )

    return renderDocument({
      title: `${featuresEntry.data.title} - Pagesmith + Core JSX`,
      description: featuresEntry.data.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  // Pages (about, etc.)
  const pageEntry = pageEntries.find((entry) => routeFor(entry) === routePath)
  if (pageEntry) {
    const sidebarHtml = String(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        isFeatures={false}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
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
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
      />,
    )

    return renderDocument({
      title: `${pageEntry.data.title} - Pagesmith + Core JSX`,
      description: pageEntry.data.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  // Fallback to 404
  return renderDocument({
    title: 'Page Not Found - Pagesmith + Core JSX',
    description: 'The page you requested could not be found.',
    basePath: config.base,
    cssPath: config.cssPath,
    jsPath: config.jsPath,
    searchEnabled: config.searchEnabled,
    bodyHtml:
      '<main class="doc-home"><section class="doc-home-section"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></section></main>',
  })
}
