import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings?: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: {
    name: string
    title: string
    description: string
    basePath?: string
    language?: string
    navItems?: Array<{ label: string; path: string }>
    footerLinks?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    theme?: { lightColor?: string; darkColor?: string }
    footerText?: string
    copyright?: { holder: string; startYear: number }
  }
  sidebarSections?: Array<{
    title: string
    slug: string
    items: Array<{ title: string; path: string; children?: Array<{ title: string; path: string }> }>
  }>
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
}

function assetPath(site: Props['site'], path: string): string {
  const base = site.basePath && site.basePath !== '/' ? site.basePath.replace(/\/+$/, '') : ''
  return base ? `${base}${path}` : path
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DocPage({
  content,
  frontmatter,
  headings,
  slug,
  site,
  sidebarSections,
  prev,
  next,
  editUrl,
  editLabel,
  lastUpdated,
}: Props) {
  const title = frontmatter.title ? `${frontmatter.title} - ${site.title}` : site.title
  const description = frontmatter.description || site.description
  const base = site.basePath || ''
  const searchEnabled = site.search?.enabled !== false
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'

  const tocHeadings = (headings ?? []).filter((h) => h.depth >= 2 && h.depth <= 3)
  function isNavActive(itemPath: string): boolean {
    const relative = itemPath.startsWith(base) ? itemPath.slice(base.length) : itemPath
    const section = relative.replace(/^\//, '').split('/')[0]
    return slug.startsWith(`${base}/${section}`)
  }

  return (
    <html lang={site.language || 'en'} class="no-js color-scheme-auto theme-paper">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <script innerHTML="(function(){try{var p=JSON.parse(localStorage.getItem('pagesmith-theme'));if(p){var d=document.documentElement;if(p.colorScheme)d.className=d.className.replace(/color-scheme-\\w+/,'color-scheme-'+p.colorScheme);if(p.theme)d.className=d.className.replace(/theme-[\\w-]+/,'theme-'+p.theme);if(p.textSize&&p.textSize!=='base')d.dataset.textSize=p.textSize}}catch(e){}})()" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />
        {searchEnabled ? (
          <link rel="stylesheet" href={assetPath(site, '/pagefind/pagefind-component-ui.css')} />
        ) : null}
        <link rel="stylesheet" href={assetPath(site, '/assets/style.css')} />
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? (
          <script src={assetPath(site, '/pagefind/pagefind-component-ui.js')} type="module" />
        ) : null}
      </head>
      <body>
        <input type="checkbox" id="sidebar-toggle" class="sr-only" />
        <header class="doc-header">
          <div class="doc-header-inner">
            <div class="doc-header-left">
              <label
                for="sidebar-toggle"
                class="doc-sidebar-toggle"
                role="button"
                aria-label="Toggle navigation"
                innerHTML={hamburgerIcon}
              />
              <a href={(site as any).homeLink || (base ? `${base}/` : '/')} class="doc-logo">
                {site.name}
              </a>
            </div>
            {site.navItems && site.navItems.length > 0 ? (
              <nav class="doc-nav">
                {site.navItems.map((item) => (
                  <a href={item.path} class={isNavActive(item.path) ? 'active' : ''}>
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : null}
            <div class="doc-theme-toggle no-js-hidden" data-theme-toggle="">
              <button
                type="button"
                class="doc-theme-toggle-btn"
                aria-label="Change theme"
                aria-expanded="false"
                aria-haspopup="true"
                data-theme-toggle-btn=""
                innerHTML={themeIcon}
              />
              <div class="doc-theme-dropdown" data-theme-dropdown="" hidden>
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
                      <input type="radio" name="textSize" value="small" />
                      <span class="doc-text-size-label" data-size="small">
                        A
                      </span>
                    </label>
                    <label class="doc-text-size-option" title="Default">
                      <input type="radio" name="textSize" value="base" checked />
                      <span class="doc-text-size-label" data-size="base">
                        A
                      </span>
                    </label>
                    <label class="doc-text-size-option" title="Large">
                      <input type="radio" name="textSize" value="large" />
                      <span class="doc-text-size-label" data-size="large">
                        A
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </div>
            {searchEnabled ? <pagefind-modal-trigger class="doc-search-trigger" /> : null}
          </div>
        </header>
        <main class="doc-layout" data-pagefind-body="">
          {sidebarSections ? (
            <aside class="doc-sidebar" aria-label="Sidebar navigation">
              <nav class="doc-sidebar-nav">
                {sidebarSections.map((section) => {
                  const collapsible = (site as any).sidebar?.collapsible
                  const hasActive = section.items.some(
                    (item) =>
                      slug === item.path ||
                      slug === item.path.replace(/\/$/, '') ||
                      (item.children && item.children.some((c) => slug === c.path)),
                  )
                  const isOpen = !(section as any).collapsed || hasActive

                  const content = (
                    <ul class="doc-sidebar-list">
                      {section.items.map((item) => (
                        <li>
                          <a
                            href={item.path}
                            class={`doc-sidebar-link${slug === item.path || slug === item.path.replace(/\/$/, '') ? ' active' : ''}`}
                          >
                            {item.title}
                          </a>
                          {item.children && item.children.length > 0 ? (
                            <ul class="doc-sidebar-nested">
                              {item.children.map((child) => (
                                <li>
                                  <a
                                    href={child.path}
                                    class={`doc-sidebar-link${slug === child.path ? ' active' : ''}`}
                                  >
                                    {child.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )

                  if (collapsible) {
                    return (
                      <details
                        class="doc-sidebar-section doc-sidebar-collapsible"
                        open={isOpen || undefined}
                      >
                        <summary class="doc-sidebar-heading">{section.title}</summary>
                        {content}
                      </details>
                    )
                  }

                  return (
                    <div class="doc-sidebar-section">
                      <p class="doc-sidebar-heading">{section.title}</p>
                      {content}
                    </div>
                  )
                })}
              </nav>
            </aside>
          ) : null}
          <article class="doc-main">
            {tocHeadings.length > 0 ? (
              <details class="doc-toc-mobile">
                <summary>On this page</summary>
                <nav>
                  <ul class="doc-toc-list">
                    {tocHeadings.map((h) => (
                      <li>
                        <a href={`#${h.slug}`} class={`doc-toc-link depth-${h.depth}`}>
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            ) : null}
            <div class="prose" innerHTML={content} />
            {prev || next ? (
              <nav class="doc-article-nav" aria-label="Page navigation">
                {prev ? (
                  <a href={prev.path + '/'} class="doc-article-link doc-article-prev">
                    <span class="doc-article-label">Previous</span>
                    <span class="doc-article-title">{prev.title}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next ? (
                  <a href={next.path + '/'} class="doc-article-link doc-article-next">
                    <span class="doc-article-label">Next</span>
                    <span class="doc-article-title">{next.title}</span>
                  </a>
                ) : null}
              </nav>
            ) : null}
            <footer class="doc-footer">
              {editUrl || lastUpdated ? (
                <div class="doc-page-meta">
                  {editUrl ? (
                    <a
                      href={editUrl}
                      class="doc-edit-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {editLabel || 'Edit this page'}
                    </a>
                  ) : null}
                  {lastUpdated ? (
                    <span class="doc-last-updated">
                      Last updated: <time datetime={lastUpdated}>{formatDate(lastUpdated)}</time>
                    </span>
                  ) : null}
                </div>
              ) : null}
              {site.footerLinks && site.footerLinks.length > 0 ? (
                <nav class="doc-footer-links" aria-label="Footer links">
                  {site.footerLinks.map((link) => (
                    <a href={link.path}>{link.label}</a>
                  ))}
                </nav>
              ) : null}
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
              <p class="doc-footer-signoff">
                Built with &#10084; using{' '}
                <a
                  href="https://github.com/sujeet-pro/pagesmith"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pagesmith
                </a>
              </p>
              {site.copyright ? (
                <p class="doc-footer-copyright">
                  &copy;{' '}
                  {site.copyright.startYear < new Date().getFullYear()
                    ? `${site.copyright.startYear}\u2013${new Date().getFullYear()}`
                    : `${new Date().getFullYear()}`}{' '}
                  {site.copyright.holder}
                </p>
              ) : null}
            </footer>
          </article>
          {tocHeadings.length > 0 ? (
            <aside class="doc-aside" aria-label="Table of contents">
              <nav class="doc-toc">
                <p class="doc-toc-title">On this page</p>
                <ul class="doc-toc-list">
                  {tocHeadings.map((h) => (
                    <li>
                      <a href={`#${h.slug}`} class={`doc-toc-link depth-${h.depth}`}>
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          ) : null}
        </main>
        {searchEnabled ? (
          <pagefind-modal reset-on-close="">
            <pagefind-modal-header>
              <pagefind-input />
            </pagefind-modal-header>
            <pagefind-modal-body>
              <pagefind-summary />
              <pagefind-results
                show-images={site.search?.showImages ? '' : undefined}
                hide-sub-results={site.search?.showSubResults === false ? '' : undefined}
              />
            </pagefind-modal-body>
            <pagefind-modal-footer>
              <pagefind-keyboard-hints />
            </pagefind-modal-footer>
          </pagefind-modal>
        ) : null}
        <script src={assetPath(site, '/assets/main.js')} defer />
      </body>
    </html>
  )
}
