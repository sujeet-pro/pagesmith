import { Fragment, h } from '@pagesmith/core/jsx-runtime'

type Props = {
  title: string
  description?: string
  url?: string
  socialImage?: string
  site: {
    origin: string
    basePath?: string
    name: string
    language?: string
    seo?: { locale?: string; twitterHandle?: string; defaultOgType?: string }
    theme?: { lightColor?: string; darkColor?: string }
    analytics?: { googleAnalytics?: string }
    footerLinks?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    socialImage?: string
    favicon?: string | false
    faviconFallback?: string | false
    appleTouchIcon?: string | false
  }
  children?: any
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

export function Html({ title, description, url, socialImage, site, children }: Props) {
  const origin = site.origin.replace(/\/$/, '')
  const base = site.basePath || ''
  const canonicalUrl = url ? `${origin}${url}` : undefined
  const locale = site.seo?.locale || 'en_US'
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'
  const gaId = site.analytics?.googleAnalytics
  const ogImage = socialImage ?? site.socialImage
  const searchEnabled = site.search?.enabled !== false
  const favicon = site.favicon
  const faviconFallback = site.faviconFallback
  const appleTouchIcon = site.appleTouchIcon

  return (
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />

        {/* Security */}
        <meta http-equiv="Content-Security-Policy" content={buildCsp(gaId)} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        <title>{title}</title>

        {/* Icons */}
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

        {/* Canonical URL */}
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
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

        {/* Theme color */}
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />

        {/* Performance: font preload */}
        <link
          rel="preload"
          href={`${base}/assets/fonts/open-sans-variable.woff2`}
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        {/* Performance: GA preconnect */}
        {gaId ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin="" />
        ) : null}

        {/* CSS */}
        <link rel="stylesheet" href={`${base}/assets/style.css`} />
        {searchEnabled ? <link rel="stylesheet" href={`${base}/pagefind/pagefind-ui.css`} /> : null}

        {/* Remove no-js class */}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? <script src={`${base}/pagefind/pagefind-ui.js`} defer /> : null}
        {searchEnabled ? (
          <noscript>
            <style innerHTML=".doc-search-trigger{display:none!important}" />
          </noscript>
        ) : null}

        {/* Google Analytics */}
        {gaId ? (
          <Fragment>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              innerHTML={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            />
          </Fragment>
        ) : null}
      </head>
      <body>
        {children}
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
        <script src={`${base}/assets/main.js`} defer />
      </body>
    </html>
  )
}
