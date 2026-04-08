import { renderToStaticMarkup } from 'react-dom/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import {
  type MarkdownEntry,
  type NavEntry,
  type NavGroup,
  menuIcon,
  closeIcon,
  searchIcon,
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
import featuresCollection from 'virtual:content/features'
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

const featuresEntries = [...(featuresCollection as Entry[])].sort(
  (left, right) => getTime(right.frontmatter.date) - getTime(left.frontmatter.date),
)

const pageEntries = [...(pagesCollection as Entry[])]

function groupBySeries(base: string): GuideGroup[] {
  return groupByField(guideEntries, base, 'guide', 'series')
}

// ── Layout components ──
// React-specific JSX components for the site shell (sidebar, header, pages).
// Replace these with your own framework components when porting to a new example.

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
          <li className={`doc-sidebar-item${isFeatures ? ' active' : ''}`}>
            <a href={firstFeaturesUrl} className="doc-sidebar-link">
              Features
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

      <div className="doc-sidebar-section">
        <p className="doc-sidebar-heading">Features</p>
        <ul className="doc-sidebar-list">
          {featuresEntries.map((entry) => (
            <li
              key={entry.slug}
              className={`doc-sidebar-item${currentPath === `/features/${entry.slug}` ? ' active' : ''}`}
            >
              <a href={entry.url} className="doc-sidebar-link">
                {entry.title}
              </a>
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
  firstFeaturesUrl: string
  searchEnabled?: boolean
}) {
  const { basePath, currentPath, firstGuideUrl, firstFeaturesUrl, searchEnabled } = props
  const isGuide = currentPath.startsWith('/guide')
  const isFeatures = currentPath.startsWith('/features')

  return (
    <header className="doc-header">
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
          <a href={firstFeaturesUrl} className={isFeatures ? 'active' : ''}>
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
    <>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        firstFeaturesUrl={firstFeaturesUrl}
        searchEnabled={searchEnabled}
      />
      <main className="doc-home" data-pagefind-body="">
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
            <a href={firstFeaturesUrl} className="doc-hero-action doc-hero-action-alt">
              Browse Features
            </a>
          </div>
        </section>

        <section className="doc-home-section">
          <h2>Markdown Features</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {featuresEntries.map((post) => (
              <li
                key={post.slug}
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <a href={post.url}>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{post.title}</h3>
                </a>
                {post.description ? (
                  <p
                    style={{
                      margin: '0.5rem 0 0',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {post.description}
                  </p>
                ) : null}
                {post.date ? (
                  <p
                    style={{
                      margin: '0.375rem 0 0',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {post.tags && post.tags.length > 0 ? (
                      <>
                        {' '}
                        {' · '}
                        {post.tags.join(', ')}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
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
      <div className="doc-layout">
        <aside className="doc-sidebar">
          <nav className="doc-sidebar-nav" aria-label="Documentation navigation">
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

        <main className="doc-main" data-pagefind-body>
          <article>
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
                className="doc-page-meta"
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
          </article>

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
          <li className="doc-sidebar-item">
            <a href={firstFeaturesUrl} className="doc-sidebar-link">
              Features
            </a>
          </li>
        </ul>
      </div>,
    )
    const bodyHtml = renderToStaticMarkup(
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
    const sidebarHtml = renderToStaticMarkup(
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
    const bodyHtml = renderToStaticMarkup(
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

  const featuresEntry = featuresEntries.find((entry) => routeFor(entry, 'features') === routePath)
  if (featuresEntry) {
    const sidebarHtml = renderToStaticMarkup(
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
    const bodyHtml = renderToStaticMarkup(
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
      />,
    )

    return renderDocument({
      title: `${featuresEntry.frontmatter.title} - Pagesmith + React`,
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
    const sidebarHtml = renderToStaticMarkup(
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
    const bodyHtml = renderToStaticMarkup(
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
