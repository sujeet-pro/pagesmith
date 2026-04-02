import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  content: string
  frontmatter: Record<string, any>
  slug: string
  site: {
    name: string
    title: string
    description: string
    basePath?: string
    origin: string
    language?: string
    navItems?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    theme?: { lightColor?: string; darkColor?: string }
  }
}

function assetPath(site: Props['site'], path: string): string {
  const base = site.basePath && site.basePath !== '/' ? site.basePath.replace(/\/+$/, '') : ''
  return base ? `${base}${path}` : path
}

const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

export default function DocHome({ content, frontmatter, slug, site }: Props) {
  const title = frontmatter.title || site.title
  const description = frontmatter.description || site.description
  const base = site.basePath || ''
  const searchEnabled = site.search?.enabled !== false
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'

  const hero = frontmatter.hero ?? {}
  const features = frontmatter.features ?? []
  const actions = hero.actions ?? frontmatter.actions ?? []

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
        <header class="doc-header">
          <div class="doc-header-inner">
            <div class="doc-header-left">
              <a href={(site as any).homeLink || (base ? `${base}/` : '/')} class="doc-logo">
                {site.name}
              </a>
            </div>
            {site.navItems && site.navItems.length > 0 ? (
              <nav class="doc-nav">
                {site.navItems.map((item) => (
                  <a href={item.path}>{item.label}</a>
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
        <main class="doc-home" data-pagefind-body="">
          <section class="doc-hero">
            {hero.name ? <p class="doc-hero-name">{hero.name}</p> : null}
            <h1 class="doc-hero-text">{hero.text ?? title}</h1>
            {(hero.tagline ?? frontmatter.tagline) ? (
              <p class="doc-hero-tagline">{hero.tagline ?? frontmatter.tagline}</p>
            ) : null}
            {actions.length > 0 ? (
              <div class="doc-hero-actions">
                {actions.map((action: any) => (
                  <a
                    href={action.link}
                    class={`doc-hero-action ${action.theme === 'brand' ? 'doc-hero-action-brand' : 'doc-hero-action-alt'}`}
                  >
                    {action.text}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
          {features.length > 0 ? (
            <section class="doc-features">
              {features.map((feature: any) => (
                <div class="doc-feature-card">
                  {feature.icon ? <span class="doc-feature-icon">{feature.icon}</span> : null}
                  <h3 class="doc-feature-title">{feature.title}</h3>
                  <p class="doc-feature-details">{feature.details}</p>
                </div>
              ))}
            </section>
          ) : null}
          {content ? (
            <section class="doc-home-content">
              <div class="prose" innerHTML={content} />
            </section>
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
