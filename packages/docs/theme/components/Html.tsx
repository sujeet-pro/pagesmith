import { Fragment, h } from '@pagesmith/core/jsx-runtime'

type Props = {
  title: string
  description?: string
  url?: string
  site: {
    origin: string
    basePath?: string
    name: string
    language?: string
    seo?: { locale?: string; twitterHandle?: string; defaultOgType?: string }
    theme?: { lightColor?: string; darkColor?: string }
    analytics?: { googleAnalytics?: string }
    footerLinks?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean }
  }
  children?: any
}

export function Html({ title, description, url, site, children }: Props) {
  const origin = site.origin.replace(/\/$/, '')
  const base = site.basePath || ''
  const canonicalUrl = url ? `${origin}${url}` : undefined
  const locale = site.seo?.locale || 'en_US'
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'
  const gaId = site.analytics?.googleAnalytics
  const searchEnabled = site.search?.enabled !== false

  return (
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}

        {/* Canonical URL */}
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:locale" content={locale} />
        <meta property="og:site_name" content={site.name} />

        {/* Theme color */}
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />

        {/* Favicons */}
        <link rel="icon" type="image/x-icon" href={`${base}/favicons/favicon.ico`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${base}/favicons/favicon-32x32.png`} />

        {/* Feeds */}
        <link rel="sitemap" type="application/xml" href={`${base}/sitemap.xml`} />

        {/* CSS */}
        <link rel="stylesheet" href={`${base}/assets/style.css`} />
        {searchEnabled ? <link rel="stylesheet" href={`${base}/pagefind/pagefind-ui.css`} /> : null}

        {/* Remove no-js class */}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? <script src={`${base}/pagefind/pagefind-ui.js`} defer /> : null}
        {searchEnabled ? (
          <script
            innerHTML={`window.addEventListener('DOMContentLoaded',function(){var el=document.querySelector('[data-pagefind-search]');if(!el||typeof PagefindUI==='undefined'){return;}new PagefindUI({element:el,showSubResults:true,resetStyles:false});});`}
          />
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
        <input type="checkbox" id="sidebar-toggle" class="sr-only" />
        {children}
        <script src={`${base}/assets/main.js`} defer />
      </body>
    </html>
  )
}
