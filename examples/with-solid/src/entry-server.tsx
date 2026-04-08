import { For, Show } from 'solid-js'
import { renderToString } from 'solid-js/web'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import featuresCollection from 'virtual:content/features'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'

type MarkdownEntry = {
  contentSlug: string
  html: string
  headings: Array<{ depth: number; slug: string; text: string }>
  frontmatter: {
    title: string
    description?: string
    date?: string | Date
    tags?: string[]
    series?: string
    seriesOrder?: number
  }
}

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

const guideEntries = [...(guideCollection as MarkdownEntry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

const featuresEntries = [...(featuresCollection as MarkdownEntry[])].sort(
  (left, right) => getTime(right.frontmatter.date) - getTime(left.frontmatter.date),
)

const pageEntries = [...(pagesCollection as MarkdownEntry[])]

const menuIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'
const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

function normalizeRoute(url: string, base: string): string {
  if (!base || !url.startsWith(base)) return url === '' ? '/' : url
  const trimmed = url.slice(base.length)
  if (trimmed === '') return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function leafSlug(contentSlug: string, collection: string): string {
  return contentSlug.replace(new RegExp(`^${collection}/`), '')
}

function routeFor(entry: MarkdownEntry, collection: 'guide' | 'features' | 'pages'): string {
  const slug = leafSlug(entry.contentSlug, collection)
  return collection === 'pages' ? `/${slug}` : `/${collection}/${slug}`
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

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildNavEntries(
  entries: MarkdownEntry[],
  base: string,
  section: 'guide' | 'features',
): NavEntry[] {
  return entries.map((entry) => ({
    slug: leafSlug(entry.contentSlug, section),
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    url: `${base}/${section}/${leafSlug(entry.contentSlug, section)}`,
    date: toIso(entry.frontmatter.date),
    tags: entry.frontmatter.tags ?? [],
  }))
}

function groupBySeries(base: string): GuideGroup[] {
  const groups: GuideGroup[] = []
  const seen = new Map<string, NavEntry[]>()

  for (const entry of guideEntries) {
    const series = entry.frontmatter.series ?? 'Other'
    if (!seen.has(series)) {
      const items: NavEntry[] = []
      seen.set(series, items)
      groups.push({ series, items })
    }
    seen.get(series)!.push({
      slug: leafSlug(entry.contentSlug, 'guide'),
      title: entry.frontmatter.title,
      url: `${base}/guide/${leafSlug(entry.contentSlug, 'guide')}`,
    })
  }

  return groups
}

function SearchTrigger() {
  return <pagefind-modal-trigger class="doc-search-trigger" />
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
            Features
          </a>
        </nav>
        <Show when={searchEnabled}>
          <SearchTrigger />
        </Show>
      </div>
    </header>
  )
}

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
    <>
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
          <For each={guideGroups}>
            {(group) => (
              <li class="doc-sidebar-item expanded">
                <span
                  class="doc-sidebar-link"
                  style="font-weight:500;color:var(--color-text-secondary)"
                >
                  {group.series}
                </span>
                <ul class="doc-sidebar-nested">
                  <For each={group.items}>
                    {(entry) => (
                      <li
                        class={`doc-sidebar-item${currentPath === `/guide/${entry.slug}` ? ' active' : ''}`}
                      >
                        <a href={entry.url} class="doc-sidebar-link">
                          {entry.title}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class="doc-sidebar-section">
        <p class="doc-sidebar-heading">Features</p>
        <ul class="doc-sidebar-list">
          <For each={featuresEntries}>
            {(entry) => (
              <li
                class={`doc-sidebar-item${currentPath === `/features/${entry.slug}` ? ' active' : ''}`}
              >
                <a href={entry.url} class="doc-sidebar-link">
                  {entry.title}
                </a>
              </li>
            )}
          </For>
        </ul>
      </div>
    </>
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
    <>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={searchEnabled}
      />
      <main class="doc-home" data-pagefind-body="">
        <section class="doc-home-section doc-hero">
          <h1 class="doc-hero-text">Pagesmith + Solid</h1>
          <p class="doc-hero-tagline">
            A content-driven static site rendered with Solid and powered by Pagesmith&apos;s Vite
            content plugin.
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
          <ul style="display:flex;flex-direction:column;gap:1rem">
            <For each={featuresEntries}>
              {(post) => (
                <li style="padding:1rem 1.25rem;border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg)">
                  <a href={post.url}>
                    <h3 style="margin:0;font-size:var(--font-size-lg)">{post.title}</h3>
                  </a>
                  <Show when={post.description}>
                    <p style="margin:0.5rem 0 0;color:var(--color-text-muted);font-size:var(--font-size-sm)">
                      {post.description}
                    </p>
                  </Show>
                  <Show when={post.date}>
                    <p style="margin:0.375rem 0 0;font-size:var(--font-size-xs);color:var(--color-text-muted)">
                      <time dateTime={post.date}>{formatDate(post.date!)}</time>
                      <Show when={post.tags && post.tags.length > 0}>
                        <>
                          {' '}
                          {' · '}
                          {post.tags!.join(', ')}
                        </>
                      </Show>
                    </p>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>

        <section class="doc-home-section">
          <h2>Guide</h2>
          <ul style="display:flex;flex-direction:column;gap:0.75rem">
            <For each={guideEntries}>
              {(entry) => (
                <li>
                  <a href={entry.url} style="font-weight:500">
                    {entry.title}
                  </a>
                  <Show when={entry.description}>
                    <span style="color:var(--color-text-muted);font-size:var(--font-size-sm)">
                      {' — '}
                      {entry.description}
                    </span>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </section>

        <div class="doc-home-footer">
          <footer class="doc-footer">
            <div class="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-solid">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <div class="doc-footer-theme no-js-hidden" data-footer-theme="">
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Appearance</span>
                <div class="doc-footer-theme-options" data-footer-scheme="">
                  <button type="button" data-scheme="auto" class="active" aria-pressed="true">
                    Auto
                  </button>
                  <button type="button" data-scheme="light" aria-pressed="false">
                    Light
                  </button>
                  <button type="button" data-scheme="dark" aria-pressed="false">
                    Dark
                  </button>
                </div>
              </div>
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Theme</span>
                <div class="doc-footer-theme-options" data-footer-theme-type="">
                  <button type="button" data-theme="paper" class="active" aria-pressed="true">
                    Paper
                  </button>
                  <button type="button" data-theme="high-contrast" aria-pressed="false">
                    High Contrast
                  </button>
                </div>
              </div>
            </div>
            <p class="doc-footer-copyright">
              &copy; 2026 Pagesmith {' · '} Made with{' '}
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </p>
          </footer>
        </div>
      </main>
    </>
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
    title,
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
    <>
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
            <Show when={filteredHeadings.length > 0}>
              <details class="doc-toc-mobile">
                <summary>On this page</summary>
                <nav class="doc-toc">
                  <ul class="doc-toc-list">
                    <For each={filteredHeadings}>
                      {(heading) => (
                        <li class={`doc-toc-item depth-${heading.depth}`}>
                          <a href={`#${heading.slug}`}>{heading.text}</a>
                        </li>
                      )}
                    </For>
                  </ul>
                </nav>
              </details>
            </Show>

            <Show when={date}>
              <p
                class="doc-page-meta"
                style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem"
              >
                <time dateTime={date}>{formatDate(date!)}</time>
                <Show when={readTime}>
                  <>
                    {' '}
                    {' · '}
                    {readTime} min read
                  </>
                </Show>
              </p>
            </Show>

            <div class="prose" innerHTML={content} />
          </article>

          <footer class="doc-footer">
            <div class="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-solid">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <div class="doc-footer-theme no-js-hidden" data-footer-theme="">
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Appearance</span>
                <div class="doc-footer-theme-options" data-footer-scheme="">
                  <button type="button" data-scheme="auto" class="active" aria-pressed="true">
                    Auto
                  </button>
                  <button type="button" data-scheme="light" aria-pressed="false">
                    Light
                  </button>
                  <button type="button" data-scheme="dark" aria-pressed="false">
                    Dark
                  </button>
                </div>
              </div>
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Theme</span>
                <div class="doc-footer-theme-options" data-footer-theme-type="">
                  <button type="button" data-theme="paper" class="active" aria-pressed="true">
                    Paper
                  </button>
                  <button type="button" data-theme="high-contrast" aria-pressed="false">
                    High Contrast
                  </button>
                </div>
              </div>
            </div>
            <p class="doc-footer-copyright">
              &copy; 2026 Pagesmith {' · '} Made with{' '}
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </p>
          </footer>
        </main>

        <aside class="doc-aside">
          <Show when={filteredHeadings.length > 0}>
            <nav class="doc-toc">
              <p class="doc-toc-title">On this page</p>
              <ul class="doc-toc-list">
                <For each={filteredHeadings}>
                  {(heading) => (
                    <li class={`doc-toc-item depth-${heading.depth}`}>
                      <a href={`#${heading.slug}`}>{heading.text}</a>
                    </li>
                  )}
                </For>
              </ul>
            </nav>
          </Show>
        </aside>
      </div>
    </>
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
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-component-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-component-ui.js" type="module"></script>` : ''}
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
        ? `<pagefind-modal reset-on-close>
            <pagefind-modal-header><pagefind-input></pagefind-input></pagefind-modal-header>
            <pagefind-modal-body>
              <pagefind-summary></pagefind-summary>
              <pagefind-results></pagefind-results>
            </pagefind-modal-body>
            <pagefind-modal-footer><pagefind-keyboard-hints></pagefind-keyboard-hints></pagefind-modal-footer>
          </pagefind-modal>`
        : ''
    }
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}

function renderNotFound(config: SsgRenderConfig) {
  return renderDocument({
    title: 'Page Not Found - Pagesmith + Solid',
    description: 'The page you requested could not be found.',
    basePath: config.base,
    cssPath: config.cssPath,
    jsPath: config.jsPath,
    searchEnabled: config.searchEnabled,
    bodyHtml:
      '<main class="doc-home"><section class="doc-home-section"><div class="doc-not-found-container"><p class="doc-not-found-code">404</p><h1 class="doc-not-found-title">Page Not Found</h1></div></section></main>',
  })
}

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

  if (routePath === '/') {
    const sidebarHtml = renderToString(() => (
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
      </div>
    ))
    const bodyHtml = renderToString(() => (
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
        featuresEntries={featuresNavEntries}
      />
    ))

    return renderDocument({
      title: 'Pagesmith + Solid',
      description:
        'A content-driven static site rendered with Solid and powered by the Pagesmith Vite content plugin.',
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  if (routePath === '/404') {
    return renderNotFound(config)
  }

  const guideEntry = guideEntries.find((entry) => routeFor(entry, 'guide') === routePath)
  if (guideEntry) {
    const sidebarHtml = renderToString(() => (
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={true}
        isFeatures={false}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
      />
    ))
    const bodyHtml = renderToString(() => (
      <PageBody
        title={guideEntry.frontmatter.title}
        content={guideEntry.html}
        headings={guideEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
        date={toIso(guideEntry.frontmatter.date)}
        readTime={estimateReadTime(guideEntry.html)}
      />
    ))

    return renderDocument({
      title: `${guideEntry.frontmatter.title} - Pagesmith + Solid`,
      description: guideEntry.frontmatter.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  const featuresEntry = featuresEntries.find((entry) => routeFor(entry, 'features') === routePath)
  if (featuresEntry) {
    const sidebarHtml = renderToString(() => (
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        isFeatures={true}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
      />
    ))
    const bodyHtml = renderToString(() => (
      <PageBody
        title={featuresEntry.frontmatter.title}
        content={featuresEntry.html}
        headings={featuresEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
        date={toIso(featuresEntry.frontmatter.date)}
        readTime={estimateReadTime(featuresEntry.html)}
      />
    ))

    return renderDocument({
      title: `${featuresEntry.frontmatter.title} - Pagesmith + Solid`,
      description: featuresEntry.frontmatter.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  const aboutEntry = pageEntries.find((entry) => routeFor(entry, 'pages') === routePath)
  if (aboutEntry) {
    const sidebarHtml = renderToString(() => (
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        isFeatures={false}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        guideGroups={guideGroups}
        featuresEntries={featuresNavEntries}
      />
    ))
    const bodyHtml = renderToString(() => (
      <PageBody
        title={aboutEntry.frontmatter.title}
        content={aboutEntry.html}
        headings={aboutEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        featuresEntries={featuresNavEntries}
      />
    ))

    return renderDocument({
      title: `${aboutEntry.frontmatter.title} - Pagesmith + Solid`,
      description: aboutEntry.frontmatter.description,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
      sidebarHtml,
    })
  }

  return renderNotFound(config)
}
