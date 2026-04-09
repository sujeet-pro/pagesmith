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
    footerLinks?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    theme?: { lightColor?: string; darkColor?: string }
    footerText?: string
    copyright?: { holder: string; startYear: number }
  }
}

function assetPath(site: Props['site'], path: string): string {
  const base = site.basePath && site.basePath !== '/' ? site.basePath.replace(/\/+$/, '') : ''
  return base ? `${base}${path}` : path
}

const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

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
            <section class="doc-home-section">
              <div class="doc-features">
                {features.map((feature: any) => (
                  <div class="doc-feature-card">
                    {feature.icon ? (
                      <span class="doc-feature-icon" innerHTML={feature.icon} />
                    ) : null}
                    <h3 class="doc-feature-title">{feature.title}</h3>
                    <p class="doc-feature-details">{feature.details}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {content ? (
            <section class="doc-home-content">
              <div class="prose" innerHTML={content} />
            </section>
          ) : null}
          <div class="doc-home-footer">
            <footer class="doc-footer">
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
          </div>
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
