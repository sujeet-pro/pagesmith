import { Fragment, h } from '../jsx-runtime/index.js'
import { normalizeOrigin } from '../config.js'
import type { SiteDocumentData, SiteDocumentScript } from './types.js'

export type SitePageMeta = {
  /** Override og:type — use 'article' for content pages. Defaults to site.seo.defaultOgType or 'website'. */
  ogType?: string
  /** ISO 8601 date string for article:published_time */
  publishedTime?: string
  /** ISO 8601 date string for article:modified_time */
  modifiedTime?: string
  /** Author name for article:author (falls back to site.maintainer.name) */
  author?: string
  /** Tags for article:tag */
  tags?: string[]
}

export type SiteDocumentProps = {
  title: string
  description?: string
  url?: string
  socialImage?: string
  site: SiteDocumentData
  meta?: SitePageMeta
  headChildren?: unknown
  bodyEnd?: unknown
  children?: unknown
}

function buildCsp(gaId?: string): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"]
  const connectSrc = ["'self'"]

  if (gaId) {
    scriptSrc.push('https://www.googletagmanager.com')
    connectSrc.push('https://www.google-analytics.com', 'https://analytics.google.com')
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function renderScript(script: SiteDocumentScript) {
  return (
    <script
      src={script.src}
      type={script.type}
      defer={script.defer || undefined}
      async={script.async || undefined}
    />
  )
}

export function SiteDocument({
  title,
  description,
  url,
  socialImage,
  site,
  meta,
  headChildren,
  bodyEnd,
  children,
}: SiteDocumentProps) {
  const origin = normalizeOrigin(site.origin)
  const base = site.basePath || ''
  const canonicalUrl = url ? `${origin}${url}` : undefined
  const locale = site.seo?.locale || 'en_US'
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'
  const gaId = site.analytics?.googleAnalytics
  const ogImage = socialImage ?? site.socialImage
  const ogType = meta?.ogType || site.seo?.defaultOgType || 'website'
  const isArticle = ogType === 'article'
  const articleAuthor = meta?.author || (isArticle ? site.maintainer?.name : undefined)
  const twitterHandle = site.seo?.twitterHandle
  const searchEnabled = site.search?.enabled !== false
  const favicon = site.favicon
  const faviconFallback = site.faviconFallback
  const appleTouchIcon = site.appleTouchIcon
  const defaultColorScheme = site.theme?.defaultColorScheme || 'auto'
  const defaultTheme = site.theme?.defaultTheme || 'paper'
  const defaultTextSize = site.theme?.defaultTextSize || 'base'
  const htmlClass = `no-js color-scheme-${defaultColorScheme} theme-${defaultTheme}`
  const foucScript = `(function(){try{var p=JSON.parse(localStorage.getItem('pagesmith-theme'));if(p){var d=document.documentElement;if(p.colorScheme)d.className=d.className.replace(/color-scheme-\\w+/,'color-scheme-'+p.colorScheme);if(p.theme)d.className=d.className.replace(/theme-\\w[\\w-]*/,'theme-'+p.theme);if(p.textSize&&p.textSize!=='base')d.dataset.textSize=p.textSize}}catch(e){}})();`
  const stylesheets = [site.cssPath ?? `${base}/assets/style.css`, ...(site.stylesheets ?? [])]
  const scripts =
    site.scripts ??
    (site.jsPath
      ? [{ src: site.jsPath, type: 'module' as const }]
      : [{ src: `${base}/assets/main.js`, defer: true }])

  return (
    <html
      lang={site.language || 'en'}
      class={htmlClass}
      data-text-size={defaultTextSize !== 'base' ? defaultTextSize : undefined}
    >
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <script innerHTML={foucScript} />
        <meta http-equiv="Content-Security-Policy" content={buildCsp(gaId)} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <title>{title}</title>
        {favicon !== false && favicon ? (
          <link
            rel="icon"
            href={favicon}
            type={favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon'}
          />
        ) : null}
        {faviconFallback ? <link rel="icon" href={faviconFallback} sizes="32x32" /> : null}
        {appleTouchIcon ? <link rel="apple-touch-icon" href={appleTouchIcon} /> : null}
        {description ? <meta name="description" content={description} /> : null}
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
        <meta property="og:type" content={ogType} />
        {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        {ogImage ? (
          <meta
            property="og:image"
            content={ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`}
          />
        ) : null}
        <meta property="og:locale" content={locale} />
        <meta property="og:site_name" content={site.name} />
        {isArticle && articleAuthor ? (
          <meta property="article:author" content={articleAuthor} />
        ) : null}
        {isArticle && meta?.publishedTime ? (
          <meta property="article:published_time" content={meta.publishedTime} />
        ) : null}
        {isArticle && meta?.modifiedTime ? (
          <meta property="article:modified_time" content={meta.modifiedTime} />
        ) : null}
        {isArticle && meta?.tags
          ? meta.tags.map((tag) => <meta property="article:tag" content={tag} />)
          : null}
        <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={title} />
        {description ? <meta name="twitter:description" content={description} /> : null}
        {ogImage ? (
          <meta
            name="twitter:image"
            content={ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`}
          />
        ) : null}
        {twitterHandle ? <meta name="twitter:site" content={twitterHandle} /> : null}
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />
        <link
          rel="preload"
          href={`${base}/assets/fonts/open-sans-variable.woff2`}
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        {gaId ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin="" />
        ) : null}
        {searchEnabled ? (
          <link rel="stylesheet" href={`${base}/pagefind/pagefind-component-ui.css`} />
        ) : null}
        {stylesheets.map((href) => (
          <link rel="stylesheet" href={href} />
        ))}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? (
          <script src={`${base}/pagefind/pagefind-component-ui.js`} type="module" />
        ) : null}
        {gaId ? (
          <Fragment>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              innerHTML={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            />
          </Fragment>
        ) : null}
        {headChildren}
      </head>
      <body>
        {children}
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
        {bodyEnd}
        {scripts.map((script) => renderScript(script))}
      </body>
    </html>
  )
}
