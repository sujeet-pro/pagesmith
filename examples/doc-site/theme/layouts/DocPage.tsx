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
  }
  sidebarSections?: Array<{
    title: string
    slug: string
    items: Array<{ title: string; path: string; children?: Array<{ title: string; path: string }> }>
  }>
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
}

function assetPath(site: Props['site'], path: string): string {
  const base = site.basePath && site.basePath !== '/' ? site.basePath.replace(/\/+$/, '') : ''
  return base ? `${base}${path}` : path
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

export default function DocPage({
  content,
  frontmatter,
  headings,
  slug,
  site,
  sidebarSections,
  prev,
  next,
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
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />
        <link rel="stylesheet" href={assetPath(site, '/assets/style.css')} />
        {searchEnabled ? (
          <link rel="stylesheet" href={assetPath(site, '/pagefind/pagefind-ui.css')} />
        ) : null}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? <script src={assetPath(site, '/pagefind/pagefind-ui.js')} defer /> : null}
        {searchEnabled ? (
          <noscript>
            <style innerHTML=".doc-search-trigger{display:none!important}" />
          </noscript>
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
            {searchEnabled ? (
              <button
                type="button"
                class="doc-search-trigger"
                aria-label="Search"
                data-search-trigger=""
              >
                <span class="doc-search-icon" innerHTML={searchIcon} />
                <kbd class="doc-search-shortcut">
                  <span class="doc-search-shortcut-key">⌘</span>K
                </kbd>
              </button>
            ) : null}
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
              <footer class="doc-footer-nav">
                <div class="doc-footer-nav-grid">
                  {prev ? (
                    <a href={prev.path} class="doc-footer-link doc-footer-prev">
                      <span class="doc-footer-label">Previous</span>
                      <span class="doc-footer-title">{prev.title}</span>
                    </a>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <a href={next.path} class="doc-footer-link doc-footer-next">
                      <span class="doc-footer-label">Next</span>
                      <span class="doc-footer-title">{next.title}</span>
                    </a>
                  ) : null}
                </div>
              </footer>
            ) : null}
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
          <dialog
            class="doc-search-modal"
            id="search-modal"
            aria-label="Search documentation"
            data-search-show-images={site.search?.showImages ? 'true' : 'false'}
            data-search-show-sub-results={site.search?.showSubResults !== false ? 'true' : 'false'}
          >
            <div class="doc-search-modal-inner">
              <div class="doc-search-modal-header">
                <span class="doc-search-modal-title">Search</span>
                <button
                  type="button"
                  class="doc-search-modal-close"
                  aria-label="Close search"
                  data-search-close=""
                  innerHTML='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'
                />
              </div>
              <div class="doc-search-modal-body" data-pagefind-search="" />
            </div>
          </dialog>
        ) : null}
        <script src={assetPath(site, '/assets/main.js')} defer />
      </body>
    </html>
  )
}
