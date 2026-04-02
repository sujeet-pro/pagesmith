import { renderToStaticMarkup } from 'react-dom/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import blogCollection from 'virtual:content/blog'
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

const blogEntries = [...(blogCollection as MarkdownEntry[])].sort(
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

function routeFor(entry: MarkdownEntry, collection: 'guide' | 'blog' | 'pages'): string {
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
  section: 'guide' | 'blog',
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

function SidebarNav(props: {
  currentPath: string
  basePath: string
  isGuide: boolean
  isBlog: boolean
  firstGuideUrl: string
  firstBlogUrl: string
  guideGroups: GuideGroup[]
  blogEntries: NavEntry[]
}) {
  const {
    currentPath,
    basePath,
    isGuide,
    isBlog,
    firstGuideUrl,
    firstBlogUrl,
    guideGroups,
    blogEntries,
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
          <li className={`doc-sidebar-item${isBlog ? ' active' : ''}`}>
            <a href={firstBlogUrl} className="doc-sidebar-link">
              Blog
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
        <p className="doc-sidebar-heading">Blog</p>
        <ul className="doc-sidebar-list">
          {blogEntries.map((entry) => (
            <li
              key={entry.slug}
              className={`doc-sidebar-item${currentPath === `/blog/${entry.slug}` ? ' active' : ''}`}
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
  return (
    <button type="button" className="doc-search-trigger" data-search-trigger="" aria-label="Search">
      <span className="doc-search-icon" dangerouslySetInnerHTML={{ __html: searchIcon }} />
      <kbd className="doc-search-shortcut">
        <span className="doc-search-shortcut-key">⌘</span>K
      </kbd>
    </button>
  )
}

function SiteHeader(props: {
  basePath: string
  currentPath: string
  firstGuideUrl: string
  firstBlogUrl: string
  searchEnabled?: boolean
}) {
  const { basePath, currentPath, firstGuideUrl, firstBlogUrl, searchEnabled } = props
  const isGuide = currentPath.startsWith('/guide')
  const isBlog = currentPath.startsWith('/blog')

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
          <a href={firstBlogUrl} className={isBlog ? 'active' : ''}>
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
  firstBlogUrl: string
  searchEnabled?: boolean
  guideEntries: NavEntry[]
  blogEntries: NavEntry[]
}) {
  const { basePath, firstGuideUrl, firstBlogUrl, searchEnabled, guideEntries, blogEntries } = props

  return (
    <>
      <SiteHeader
        basePath={basePath}
        currentPath="/"
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
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
            <a href={firstBlogUrl} className="doc-hero-action doc-hero-action-alt">
              Browse the Blog
            </a>
          </div>
        </section>

        <section className="doc-home-section">
          <h2>Recent Blog Posts</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {blogEntries.map((post) => (
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
  firstBlogUrl: string
  searchEnabled?: boolean
  sidebar: GuideGroup[]
  blogEntries: NavEntry[]
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
    firstBlogUrl,
    searchEnabled,
    sidebar,
    blogEntries,
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
        firstBlogUrl={firstBlogUrl}
        searchEnabled={searchEnabled}
      />
      <div className="doc-layout">
        <aside className="doc-sidebar">
          <nav className="doc-sidebar-nav" aria-label="Documentation navigation">
            <SidebarNav
              currentPath={currentPath}
              basePath={basePath}
              isGuide={currentPath.startsWith('/guide')}
              isBlog={currentPath.startsWith('/blog')}
              firstGuideUrl={firstGuideUrl}
              firstBlogUrl={firstBlogUrl}
              guideGroups={sidebar}
              blogEntries={blogEntries}
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
            <a href={firstBlogUrl} className="doc-sidebar-link">
              Blog
            </a>
          </li>
        </ul>
      </div>,
    )
    const bodyHtml = renderToStaticMarkup(
      <HomeBody
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
        searchEnabled={config.searchEnabled}
        guideEntries={guideNavEntries}
        blogEntries={blogNavEntries}
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
        isBlog={false}
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
        guideGroups={guideGroups}
        blogEntries={blogNavEntries}
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
        firstBlogUrl={firstBlogUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        blogEntries={blogNavEntries}
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

  const blogEntry = blogEntries.find((entry) => routeFor(entry, 'blog') === routePath)
  if (blogEntry) {
    const sidebarHtml = renderToStaticMarkup(
      <SidebarNav
        currentPath={routePath}
        basePath={config.base}
        isGuide={false}
        isBlog={true}
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
        guideGroups={guideGroups}
        blogEntries={blogNavEntries}
      />,
    )
    const bodyHtml = renderToStaticMarkup(
      <PageBody
        title={blogEntry.frontmatter.title}
        content={blogEntry.html}
        headings={blogEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        blogEntries={blogNavEntries}
        date={toIso(blogEntry.frontmatter.date)}
        readTime={estimateReadTime(blogEntry.html)}
      />,
    )

    return renderDocument({
      title: `${blogEntry.frontmatter.title} - Pagesmith + React`,
      description: blogEntry.frontmatter.description,
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
        isBlog={false}
        firstGuideUrl={firstGuideUrl}
        firstBlogUrl={firstBlogUrl}
        guideGroups={guideGroups}
        blogEntries={blogNavEntries}
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
        firstBlogUrl={firstBlogUrl}
        searchEnabled={config.searchEnabled}
        sidebar={guideGroups}
        blogEntries={blogNavEntries}
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
