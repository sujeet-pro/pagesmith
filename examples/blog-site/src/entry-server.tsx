/**
 * SSG entry for pagesmithSsg: owns collection config, Markdown rendering, and HTML shell.
 * Why one file: shows the full core-only integration without splitting into a framework app.
 */
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
const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

// ── Content Layer ──

/** Fresh layer per call so `config.root` from SSG always wins over local dev paths. */
function buildLayer(root?: string) {
  const contentRoot = root ? resolve(root) : resolve(import.meta.dirname, '..')

  // Inline collections replace pagesmithContent: same APIs, no virtual modules.
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

/** Central Markdown seam: `entry.render()` runs the shared pipeline (not app-level processMarkdown). */
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
  firstGuideUrl: string
  guideGroups: GuideGroup[]
}) {
  const { currentPath, basePath, isGuide, firstGuideUrl, guideGroups } = props

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
    </Fragment>
  )
}

function SearchTrigger() {
  return <pagefind-modal-trigger class="doc-search-trigger" />
}

function SiteHeader(props: {
  basePath: string
  currentPath: string
  firstGuideUrl: string
  searchEnabled?: boolean
}) {
  const { basePath, currentPath, firstGuideUrl, searchEnabled } = props
  const isGuide = currentPath.startsWith('/guide')

  return (
    <header class="doc-header">
      <a
        href="#doc-main-content"
        class="doc-skip-link"
        onclick="document.getElementById('doc-main-content')?.focus()"
      >
        Skip to main content
      </a>
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
        </nav>
        <div class="doc-header-right">
          {searchEnabled ? <SearchTrigger /> : null}
          <div class="doc-theme-toggle no-js-hidden" data-theme-toggle="">
            <button
              type="button"
              class="doc-theme-toggle-btn"
              aria-label="Change theme"
              aria-expanded="false"
              aria-haspopup="true"
              aria-controls="doc-theme-dropdown"
              data-theme-toggle-btn=""
              innerHTML={themeIcon}
            />
            <div id="doc-theme-dropdown" class="doc-theme-dropdown" data-theme-dropdown="" hidden>
              <fieldset class="doc-theme-group">
                <legend>Appearance</legend>
                <label class="doc-theme-option" data-scheme="auto">
                  <input type="radio" name="colorScheme" value="auto" checked />
                  Auto
                </label>
                <label class="doc-theme-option" data-scheme="light">
                  <input type="radio" name="colorScheme" value="light" />
                  Light
                </label>
                <label class="doc-theme-option" data-scheme="dark">
                  <input type="radio" name="colorScheme" value="dark" />
                  Dark
                </label>
              </fieldset>
              <fieldset class="doc-theme-group">
                <legend>Theme</legend>
                <label class="doc-theme-option" data-theme="paper">
                  <input type="radio" name="theme" value="paper" checked />
                  Paper
                </label>
                <label class="doc-theme-option" data-theme="high-contrast">
                  <input type="radio" name="theme" value="high-contrast" />
                  High Contrast
                </label>
              </fieldset>
              <fieldset class="doc-theme-group">
                <legend>Text Size</legend>
                <div class="doc-text-size-options">
                  <label class="doc-text-size-option" title="Small">
                    <input class="sr-only" type="radio" name="textSize" value="small" />
                    <span class="doc-text-size-label" data-size="small" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Small text size</span>
                  </label>
                  <label class="doc-text-size-option" title="Default">
                    <input class="sr-only" type="radio" name="textSize" value="base" checked />
                    <span class="doc-text-size-label" data-size="base" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Default text size</span>
                  </label>
                  <label class="doc-text-size-option" title="Large">
                    <input class="sr-only" type="radio" name="textSize" value="large" />
                    <span class="doc-text-size-label" data-size="large" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Large text size</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function HomeBody(props: {
  basePath: string
  firstGuideUrl: string
  kitchenSinkUrl: string
  searchEnabled?: boolean
  guideEntries: NavEntry[]
}) {
  const { basePath, firstGuideUrl, kitchenSinkUrl, searchEnabled, guideEntries } = props

  return (
    <Fragment>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        searchEnabled={searchEnabled}
      />
      <main id="doc-main-content" class="doc-home" tabindex="-1" data-pagefind-body="">
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
            <a href={kitchenSinkUrl} class="doc-hero-action doc-hero-action-alt">
              Open Kitchen Sink
            </a>
          </div>
        </section>

        <section class="doc-home-section">
          <h2>Markdown Kitchen Sink</h2>
          <p>
            This example keeps one dedicated regression page for markdown rendering instead of
            separate markdown smoke-test pages.
          </p>
          <p>
            <a href={kitchenSinkUrl}>Open the kitchen sink page</a>
          </p>
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
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Text Size</span>
                <div class="doc-footer-theme-options" data-footer-text-size="">
                  <button
                    type="button"
                    data-size="small"
                    aria-pressed="false"
                    aria-label="Small text"
                  >
                    <span class="doc-text-size-label" data-size="small">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="base"
                    class="active"
                    aria-pressed="true"
                    aria-label="Default text"
                  >
                    <span class="doc-text-size-label" data-size="base">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="large"
                    aria-pressed="false"
                    aria-label="Large text"
                  >
                    <span class="doc-text-size-label" data-size="large">
                      A
                    </span>
                  </button>
                </div>
              </div>
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
  searchEnabled?: boolean
  sidebar: GuideGroup[]
  date?: string
  readTime?: number
}) {
  const {
    content,
    headings,
    currentPath,
    basePath,
    firstGuideUrl,
    searchEnabled,
    sidebar,
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
        searchEnabled={searchEnabled}
      />
      <div class="doc-layout">
        <aside class="doc-sidebar">
          <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
            <SidebarNav
              currentPath={currentPath}
              basePath={basePath}
              isGuide={currentPath.startsWith('/guide')}
              firstGuideUrl={firstGuideUrl}
              guideGroups={sidebar}
            />
          </nav>
        </aside>

        <main class="doc-main">
          <article id="doc-main-content" tabindex="-1" data-pagefind-body="">
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
              <p style="color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: 1rem">
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
              <div class="doc-footer-theme-group">
                <span class="doc-footer-theme-label">Text Size</span>
                <div class="doc-footer-theme-options" data-footer-text-size="">
                  <button
                    type="button"
                    data-size="small"
                    aria-pressed="false"
                    aria-label="Small text"
                  >
                    <span class="doc-text-size-label" data-size="small">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="base"
                    class="active"
                    aria-pressed="true"
                    aria-label="Default text"
                  >
                    <span class="doc-text-size-label" data-size="base">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="large"
                    aria-pressed="false"
                    aria-label="Large text"
                  >
                    <span class="doc-text-size-label" data-size="large">
                      A
                    </span>
                  </button>
                </div>
              </div>
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

  const foucScript = `(function(){try{var p=JSON.parse(localStorage.getItem('pagesmith-theme'));if(p){var d=document.documentElement;if(p.colorScheme)d.className=d.className.replace(/color-scheme-\\w+/,'color-scheme-'+p.colorScheme);if(p.theme)d.className=d.className.replace(/theme-[\\w-]+/,'theme-'+p.theme);if(p.textSize&&p.textSize!=='base')d.dataset.textSize=p.textSize}}catch(e){}})()`

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
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-component-ui.css" />` : ''}
    <link rel="stylesheet" href="${cssPath}" />
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

// ── Data loading ──

/** Loads every collection up front so routing + nav see a consistent snapshot per request/build. */
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

/** Route manifest: plugin walks these URLs and calls `render` for each (plus dev middleware). */
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

/** Full HTML document per URL — includes base-aware links and optional Pagefind assets. */
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

  // Pages (about, etc.)
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
