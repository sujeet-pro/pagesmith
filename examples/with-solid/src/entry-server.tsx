import { For, Show } from 'solid-js'
import { renderToString } from 'solid-js/web'
import type { SsgRenderConfig } from '@pagesmith/site/vite'
import {
  type MarkdownEntry,
  type NavEntry,
  type NavGroup,
  normalizeRoute,
  leafSlug,
  routeFor,
  getTime,
  toIso,
  formatDate,
  estimateReadTime,
  buildNavEntries,
  groupByField,
  menuIcon,
  closeIcon,
  searchIcon,
} from '@pagesmith/site/ssg-utils'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'

type Frontmatter = {
  title: string
  description?: string
  date?: string | Date
  tags?: string[]
  series?: string
  seriesOrder?: number
}

type Entry = MarkdownEntry<Frontmatter>

type GuideGroup = NavGroup

const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

const guideEntries = [...(guideCollection as Entry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

const pageEntries = [...(pagesCollection as Entry[])]

function contentEditUrl(contentSlug: string): string {
  return `https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-solid/content/${contentSlug}.md`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function groupBySeries(base: string): GuideGroup[] {
  return groupByField(guideEntries, base, 'guide', 'series')
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
      <a href="#doc-main-content" class="doc-skip-link">
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
          <Show when={searchEnabled}>
            <SearchTrigger />
          </Show>
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

function SidebarNav(props: {
  currentPath: string
  basePath: string
  isGuide: boolean
  firstGuideUrl: string
  guideGroups: GuideGroup[]
}) {
  const { currentPath, basePath, isGuide, firstGuideUrl, guideGroups } = props

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
    </>
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
    <>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        searchEnabled={searchEnabled}
      />
      {/* Pagefind indexes only subtrees tagged `data-pagefind-body` (home uses main). */}
      <main id="doc-main-content" class="doc-home" tabindex="-1" data-pagefind-body="">
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
  searchEnabled?: boolean
  sidebar: GuideGroup[]
  date?: string
  readTime?: number
  prev?: { title: string; url: string }
  next?: { title: string; url: string }
  editUrl?: string
}) {
  const {
    title,
    content,
    headings,
    currentPath,
    basePath,
    firstGuideUrl,
    searchEnabled,
    sidebar,
    date,
    readTime,
    prev,
    next,
    editUrl,
  } = props
  const filteredHeadings = headings.filter((heading) => heading.depth === 2 || heading.depth === 3)

  return (
    <>
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
          {/* Inner pages: searchable body is the article, not the whole layout chrome. */}
          <article id="doc-main-content" tabindex="-1" data-pagefind-body="">
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
              <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
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

            <Show when={prev || next}>
              <nav class="doc-article-nav" aria-label="Page navigation">
                {prev ? (
                  <a href={prev.url} class="doc-article-link doc-article-prev">
                    <span class="doc-article-label">Previous</span>
                    <span class="doc-article-title">{prev.title}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next ? (
                  <a href={next.url} class="doc-article-link doc-article-next">
                    <span class="doc-article-label">Next</span>
                    <span class="doc-article-title">{next.title}</span>
                  </a>
                ) : null}
              </nav>
            </Show>
          </article>

          <footer class="doc-footer">
            <Show when={editUrl || date}>
              <div class="doc-page-meta">
                <Show when={editUrl}>
                  <a href={editUrl} class="doc-edit-link" target="_blank" rel="noopener noreferrer">
                    Edit this page
                  </a>
                </Show>
                <Show when={date}>
                  <span class="doc-last-updated">
                    Last updated: <time datetime={date}>{formatDate(date!)}</time>
                  </span>
                </Show>
              </div>
            </Show>
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

// Full HTML document as a string so the SSG plugin can write files without a second Vite
// SSR pass for the shell. Solid JSX is only used for the inner layout fragments (`bodyHtml`).
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

// `pagesmithSsg` imports this module in Node to enumerate URLs, then calls `render` per URL.
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))

  const aboutPage = pageEntries.find((entry) => leafSlug(entry.contentSlug, 'pages') === 'about')
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}

// `config` carries `base`, hashed asset paths, and `searchEnabled` (true on production build,
// false in dev middleware) so the same entry can branch on environment without custom env reads.
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
        </ul>
      </div>
    ))
    const bodyHtml = renderToString(() => (
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        kitchenSinkUrl={kitchenSinkUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
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
    const base = config.base.replace(/\/+$/, '')
    const guideIndex = guideEntries.indexOf(guideEntry)
    const prevGuide = guideIndex > 0 ? guideEntries[guideIndex - 1] : undefined
    const nextGuide =
      guideIndex >= 0 && guideIndex < guideEntries.length - 1
        ? guideEntries[guideIndex + 1]
        : undefined
    const prevNav = prevGuide
      ? {
          title: prevGuide.frontmatter.title,
          url: `${base}${routeFor(prevGuide, 'guide')}`,
        }
      : undefined
    const nextNav = nextGuide
      ? {
          title: nextGuide.frontmatter.title,
          url: `${base}${routeFor(nextGuide, 'guide')}`,
        }
      : undefined

    const sidebarHtml = renderToString(() => (
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={true}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
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
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        date={toIso(guideEntry.frontmatter.date)}
        readTime={estimateReadTime(guideEntry.html)}
        prev={prevNav}
        next={nextNav}
        editUrl={contentEditUrl(guideEntry.contentSlug)}
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

  const aboutEntry = pageEntries.find((entry) => routeFor(entry, 'pages') === routePath)
  if (aboutEntry) {
    const sidebarHtml = renderToString(() => (
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
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
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        date={toIso(aboutEntry.frontmatter.date)}
        editUrl={contentEditUrl(aboutEntry.contentSlug)}
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
