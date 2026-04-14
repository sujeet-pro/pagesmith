import { Fragment, h } from '@pagesmith/site/jsx-runtime'
import {
  AccordionTableOfContents,
  SiteFooter as SharedSiteFooter,
  SiteHeader as SharedSiteHeader,
  TableOfContents,
} from '@pagesmith/site/components'

import type { GuideGroup, NavEntry } from './content'
import { escapeHtml, formatDate } from './content'

const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'

export function SidebarNav(props: {
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

export function ExampleFooter() {
  return (
    <SharedSiteFooter
      links={[
        {
          label: 'GitHub',
          path: 'https://github.com/sujeet-pro/pagesmith/tree/main/examples/blog-site',
        },
        {
          label: 'Pagesmith',
          path: 'https://github.com/sujeet-pro/pagesmith',
        },
      ]}
      copyright={{ projectName: 'Pagesmith', startYear: 2026, endYear: 2026 }}
    />
  )
}

export function SiteHeader(props: {
  basePath: string
  currentPath: string
  firstGuideUrl: string
  searchEnabled?: boolean
}) {
  const { basePath, currentPath, firstGuideUrl, searchEnabled } = props
  return (
    <SharedSiteHeader
      siteName="Pagesmith"
      basePath={basePath}
      homeLink={`${basePath}/`}
      navItems={[
        { label: 'Home', path: `${basePath}/` },
        { label: 'Guide', path: firstGuideUrl },
      ]}
      currentPath={currentPath}
      searchEnabled={searchEnabled}
    />
  )
}

export function HomeBody(props: {
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
          <h1 class="doc-hero-text">Pagesmith + Site JSX</h1>
          <p class="doc-hero-tagline">
            A content-driven static site using @pagesmith/site -- no framework, no virtual modules,
            just the content layer API and the site JSX runtime.
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
          <ExampleFooter />
        </div>
      </main>
    </Fragment>
  )
}

export function PageBody(props: {
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
              <AccordionTableOfContents headings={filteredHeadings as any} />
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

          <ExampleFooter />
        </main>

        <aside class="doc-aside">
          {filteredHeadings.length > 0 ? (
            <TableOfContents headings={filteredHeadings as any} />
          ) : null}
        </aside>
      </div>
    </Fragment>
  )
}

export function renderDocument(props: {
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
        ? `<dialog class="doc-sidebar-modal" id="sidebar-modal" data-sidebar-modal="">
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
