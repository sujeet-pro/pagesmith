// SSG entry for pagesmithSsg: virtual collections → React layout → static HTML via renderDocumentShell.
import { renderToStaticMarkup } from 'react-dom/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import {
  type MarkdownEntry,
  type NavEntry,
  type NavGroup,
  menuIcon,
  closeIcon,
  normalizeRoute,
  leafSlug,
  routeFor,
  getTime,
  toIso,
  formatDate,
  estimateReadTime,
  escapeHtml,
  buildNavEntries,
  groupByField,
  renderDocumentShell,
} from '@pagesmith/core/ssg-utils'
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

const guideEntries = [...(guideCollection as Entry[])].sort((left, right) => {
  const orderDelta = (left.frontmatter.seriesOrder ?? 99) - (right.frontmatter.seriesOrder ?? 99)
  if (orderDelta !== 0) return orderDelta
  return getTime(left.frontmatter.date) - getTime(right.frontmatter.date)
})

const pageEntries = [...(pagesCollection as Entry[])]

function groupBySeries(base: string): GuideGroup[] {
  return groupByField(guideEntries, base, 'guide', 'series')
}

const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

// ── Layout components ──
// React-specific JSX components for the site shell (sidebar, header, pages).
// Replace these with your own framework components when porting to a new example.

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
      <div className="doc-sidebar-section">
        <p className="doc-sidebar-heading">Navigation</p>
        <ul className="doc-sidebar-list">
          <li className={`doc-sidebar-item${currentPath === '/' ? ' active' : ''}`}>
            <a href={`${basePath}/`} className="doc-sidebar-link">
              Home
            </a>
          </li>
          <li className={`doc-sidebar-item${isGuide ? ' active' : ''}`}>
            <a href={firstGuideUrl} className="doc-sidebar-link">
              Guide
            </a>
          </li>
          <li className={`doc-sidebar-item${currentPath === '/about' ? ' active' : ''}`}>
            <a href={`${basePath}/about`} className="doc-sidebar-link">
              About
            </a>
          </li>
        </ul>
      </div>

      <div className="doc-sidebar-section">
        <p className="doc-sidebar-heading">Guide</p>
        <ul className="doc-sidebar-list">
          {guideGroups.map((group) => (
            <li key={group.series} className="doc-sidebar-item expanded">
              <span
                className="doc-sidebar-link"
                style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}
              >
                {group.series}
              </span>
              <ul className="doc-sidebar-nested">
                {group.items.map((entry) => (
                  <li
                    key={entry.slug}
                    className={`doc-sidebar-item${currentPath === `/guide/${entry.slug}` ? ' active' : ''}`}
                  >
                    <a href={entry.url} className="doc-sidebar-link">
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function SearchTrigger() {
  return <pagefind-modal-trigger className="doc-search-trigger" />
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
    <header className="doc-header">
      <a href="#doc-main-content" className="doc-skip-link">
        Skip to main content
      </a>
      <div className="doc-header-inner">
        <div className="doc-header-left">
          <button
            type="button"
            className="doc-sidebar-toggle"
            aria-label="Toggle navigation"
            data-sidebar-toggle=""
            dangerouslySetInnerHTML={{ __html: menuIcon }}
          />
          <a href="/pagesmith/" className="doc-logo">
            Pagesmith
          </a>
        </div>
        <nav className="doc-nav">
          <a href={`${basePath}/`} className={currentPath === '/' ? 'active' : ''}>
            Home
          </a>
          <a href={firstGuideUrl} className={isGuide ? 'active' : ''}>
            Guide
          </a>
        </nav>
        <div className="doc-header-right">
          {searchEnabled ? <SearchTrigger /> : null}
          <div className="doc-theme-toggle no-js-hidden" data-theme-toggle="">
            <button
              type="button"
              className="doc-theme-toggle-btn"
              aria-label="Change theme"
              aria-expanded="false"
              aria-haspopup="true"
              aria-controls="doc-theme-dropdown"
              data-theme-toggle-btn=""
              dangerouslySetInnerHTML={{ __html: themeIcon }}
            />
            <div
              id="doc-theme-dropdown"
              className="doc-theme-dropdown"
              data-theme-dropdown=""
              hidden
            >
              <fieldset className="doc-theme-group">
                <legend>Appearance</legend>
                <label className="doc-theme-option" data-scheme="auto">
                  <input type="radio" name="colorScheme" defaultValue="auto" defaultChecked />
                  Auto
                </label>
                <label className="doc-theme-option" data-scheme="light">
                  <input type="radio" name="colorScheme" defaultValue="light" />
                  Light
                </label>
                <label className="doc-theme-option" data-scheme="dark">
                  <input type="radio" name="colorScheme" defaultValue="dark" />
                  Dark
                </label>
              </fieldset>
              <fieldset className="doc-theme-group">
                <legend>Theme</legend>
                <label className="doc-theme-option" data-theme="paper">
                  <input type="radio" name="theme" defaultValue="paper" defaultChecked />
                  Paper
                </label>
                <label className="doc-theme-option" data-theme="high-contrast">
                  <input type="radio" name="theme" defaultValue="high-contrast" />
                  High Contrast
                </label>
              </fieldset>
              <fieldset className="doc-theme-group">
                <legend>Text Size</legend>
                <div className="doc-text-size-options">
                  <label className="doc-text-size-option" title="Small">
                    <input className="sr-only" type="radio" name="textSize" defaultValue="small" />
                    <span className="doc-text-size-label" data-size="small" aria-hidden="true">
                      A
                    </span>
                    <span className="sr-only">Small text size</span>
                  </label>
                  <label className="doc-text-size-option" title="Default">
                    <input
                      className="sr-only"
                      type="radio"
                      name="textSize"
                      defaultValue="base"
                      defaultChecked
                    />
                    <span className="doc-text-size-label" data-size="base" aria-hidden="true">
                      A
                    </span>
                    <span className="sr-only">Default text size</span>
                  </label>
                  <label className="doc-text-size-option" title="Large">
                    <input className="sr-only" type="radio" name="textSize" defaultValue="large" />
                    <span className="doc-text-size-label" data-size="large" aria-hidden="true">
                      A
                    </span>
                    <span className="sr-only">Large text size</span>
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
    <>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        searchEnabled={searchEnabled}
      />
      <main id="doc-main-content" className="doc-home" tabIndex={-1} data-pagefind-body="">
        <section className="doc-home-section doc-hero">
          <h1 className="doc-hero-text">Pagesmith + React</h1>
          <p className="doc-hero-tagline">
            A content-driven static site rendered with React and powered by Pagesmith&apos;s Vite
            content plugin.
          </p>
          <div className="doc-hero-actions">
            <a href={firstGuideUrl} className="doc-hero-action doc-hero-action-brand">
              Read the Guide
            </a>
            <a href={kitchenSinkUrl} className="doc-hero-action doc-hero-action-alt">
              Open Kitchen Sink
            </a>
          </div>
        </section>

        <section className="doc-home-section">
          <h2>Markdown Kitchen Sink</h2>
          <p>
            This example keeps one dedicated regression page for markdown rendering instead of
            separate markdown smoke-test pages.
          </p>
          <p>
            <a href={kitchenSinkUrl}>Open the kitchen sink page</a>
          </p>
        </section>

        <section className="doc-home-section">
          <h2>Guide</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {guideEntries.map((entry) => (
              <li key={entry.slug}>
                <a href={entry.url} style={{ fontWeight: 500 }}>
                  {entry.title}
                </a>
                {entry.description ? (
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {' — '}
                    {entry.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <div className="doc-home-footer">
          <footer className="doc-footer">
            <div className="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-react">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <div className="doc-footer-theme no-js-hidden" data-footer-theme="">
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Appearance</span>
                <div className="doc-footer-theme-options" data-footer-scheme="">
                  <button type="button" data-scheme="auto" className="active" aria-pressed="true">
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
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Theme</span>
                <div className="doc-footer-theme-options" data-footer-theme-type="">
                  <button type="button" data-theme="paper" className="active" aria-pressed="true">
                    Paper
                  </button>
                  <button type="button" data-theme="high-contrast" aria-pressed="false">
                    High Contrast
                  </button>
                </div>
              </div>
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Text Size</span>
                <div className="doc-footer-theme-options" data-footer-text-size="">
                  <button
                    type="button"
                    data-size="small"
                    aria-pressed="false"
                    aria-label="Small text"
                  >
                    <span className="doc-text-size-label" data-size="small">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="base"
                    className="active"
                    aria-pressed="true"
                    aria-label="Default text"
                  >
                    <span className="doc-text-size-label" data-size="base">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="large"
                    aria-pressed="false"
                    aria-label="Large text"
                  >
                    <span className="doc-text-size-label" data-size="large">
                      A
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <p className="doc-footer-copyright">
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
      <div className="doc-layout">
        <aside className="doc-sidebar">
          <nav className="doc-sidebar-nav" aria-label="Documentation navigation">
            <SidebarNav
              currentPath={currentPath}
              basePath={basePath}
              isGuide={currentPath.startsWith('/guide')}
              firstGuideUrl={firstGuideUrl}
              guideGroups={sidebar}
            />
          </nav>
        </aside>

        <main className="doc-main">
          <article id="doc-main-content" tabIndex={-1} data-pagefind-body="">
            {filteredHeadings.length > 0 ? (
              <details className="doc-toc-mobile">
                <summary>On this page</summary>
                <nav className="doc-toc">
                  <ul className="doc-toc-list">
                    {filteredHeadings.map((heading) => (
                      <li key={heading.slug} className={`doc-toc-item depth-${heading.depth}`}>
                        <a href={`#${heading.slug}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            ) : null}

            {date ? (
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '1rem',
                }}
              >
                <time dateTime={date}>{formatDate(date)}</time>
                {readTime ? (
                  <>
                    {' '}
                    {' · '}
                    {readTime} min read
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
            {prev || next ? (
              <nav className="doc-article-nav" aria-label="Page navigation">
                {prev ? (
                  <a href={prev.url} className="doc-article-link doc-article-prev">
                    <span className="doc-article-label">Previous</span>
                    <span className="doc-article-title">{prev.title}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next ? (
                  <a href={next.url} className="doc-article-link doc-article-next">
                    <span className="doc-article-label">Next</span>
                    <span className="doc-article-title">{next.title}</span>
                  </a>
                ) : null}
              </nav>
            ) : null}
          </article>

          <footer className="doc-footer">
            {editUrl || date ? (
              <div className="doc-page-meta">
                {editUrl ? (
                  <a
                    href={editUrl}
                    className="doc-edit-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Edit this page
                  </a>
                ) : null}
                {date ? (
                  <span className="doc-last-updated">
                    Last updated: <time dateTime={date}>{formatDate(date)}</time>
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="doc-footer-links">
              <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-react">
                GitHub
              </a>
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </div>
            <div className="doc-footer-theme no-js-hidden" data-footer-theme="">
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Appearance</span>
                <div className="doc-footer-theme-options" data-footer-scheme="">
                  <button type="button" data-scheme="auto" className="active" aria-pressed="true">
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
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Theme</span>
                <div className="doc-footer-theme-options" data-footer-theme-type="">
                  <button type="button" data-theme="paper" className="active" aria-pressed="true">
                    Paper
                  </button>
                  <button type="button" data-theme="high-contrast" aria-pressed="false">
                    High Contrast
                  </button>
                </div>
              </div>
              <div className="doc-footer-theme-group">
                <span className="doc-footer-theme-label">Text Size</span>
                <div className="doc-footer-theme-options" data-footer-text-size="">
                  <button
                    type="button"
                    data-size="small"
                    aria-pressed="false"
                    aria-label="Small text"
                  >
                    <span className="doc-text-size-label" data-size="small">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="base"
                    className="active"
                    aria-pressed="true"
                    aria-label="Default text"
                  >
                    <span className="doc-text-size-label" data-size="base">
                      A
                    </span>
                  </button>
                  <button
                    type="button"
                    data-size="large"
                    aria-pressed="false"
                    aria-label="Large text"
                  >
                    <span className="doc-text-size-label" data-size="large">
                      A
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <p className="doc-footer-copyright">
              &copy; 2026 Pagesmith {' · '} Made with{' '}
              <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
            </p>
          </footer>
        </main>

        <aside className="doc-aside">
          {filteredHeadings.length > 0 ? (
            <nav className="doc-toc">
              <p className="doc-toc-title">On this page</p>
              <ul className="doc-toc-list">
                {filteredHeadings.map((heading) => (
                  <li key={heading.slug} className={`doc-toc-item depth-${heading.depth}`}>
                    <a href={`#${heading.slug}`}>{heading.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
    </>
  )
}

// ── Framework-specific: React rendering ──
// Document shell and SSG render/route functions. This is where React's
// renderToStaticMarkup is called. Other frameworks replace this section.

const renderDocument = renderDocumentShell

function renderNotFound(config: SsgRenderConfig) {
  return renderDocument({
    title: 'Page Not Found - Pagesmith + React',
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

  if (routePath === '/') {
    const sidebarHtml = renderToStaticMarkup(
      <div className="doc-sidebar-section">
        <p className="doc-sidebar-heading">Navigation</p>
        <ul className="doc-sidebar-list">
          <li className="doc-sidebar-item active">
            <a href={`${config.base}/`} className="doc-sidebar-link">
              Home
            </a>
          </li>
          <li className="doc-sidebar-item">
            <a href={firstGuideUrl} className="doc-sidebar-link">
              Guide
            </a>
          </li>
        </ul>
      </div>,
    )
    const bodyHtml = renderToStaticMarkup(
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        kitchenSinkUrl={kitchenSinkUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
      />,
    )

    return renderDocument({
      title: 'Pagesmith + React',
      description:
        'A content-driven static site rendered with React and powered by the Pagesmith Vite content plugin.',
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
    const guideIdx = guideEntries.indexOf(guideEntry)
    const guidePrev = guideIdx > 0 ? guideEntries[guideIdx - 1] : undefined
    const guideNext = guideIdx < guideEntries.length - 1 ? guideEntries[guideIdx + 1] : undefined
    const sidebarHtml = renderToStaticMarkup(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={true}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
      />,
    )
    const bodyHtml = renderToStaticMarkup(
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
        prev={
          guidePrev
            ? {
                title: guidePrev.frontmatter.title,
                url: `${config.base}/guide/${leafSlug(guidePrev.contentSlug, 'guide')}`,
              }
            : undefined
        }
        next={
          guideNext
            ? {
                title: guideNext.frontmatter.title,
                url: `${config.base}/guide/${leafSlug(guideNext.contentSlug, 'guide')}`,
              }
            : undefined
        }
        editUrl={`https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-react/content/${guideEntry.contentSlug}.md`}
      />,
    )

    return renderDocument({
      title: `${guideEntry.frontmatter.title} - Pagesmith + React`,
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
    const sidebarHtml = renderToStaticMarkup(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        firstGuideUrl={firstGuideUrl}
        guideGroups={guideGroups}
      />,
    )
    const bodyHtml = renderToStaticMarkup(
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
        editUrl={`https://github.com/sujeet-pro/pagesmith/edit/main/examples/with-react/content/${aboutEntry.contentSlug}.md`}
      />,
    )

    return renderDocument({
      title: `${aboutEntry.frontmatter.title} - Pagesmith + React`,
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
