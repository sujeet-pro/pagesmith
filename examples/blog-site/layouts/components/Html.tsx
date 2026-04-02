import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { SiteConfig } from '../types'
import { withBase } from '../utils'

type Props = {
  title: string
  description?: string
  url?: string
  image?: string
  pageType?: string
  noindex?: boolean
  hasLeftSidebar?: boolean
  site: SiteConfig
  children?: any
}

export function Html({
  title,
  description,
  url,
  image,
  pageType,
  noindex,
  hasLeftSidebar,
  site,
  children,
}: Props) {
  const origin = site.origin.replace(/\/$/, '')
  const canonicalUrl = url ? `${origin}${url}` : undefined
  const locale = site.seo?.locale || 'en_US'
  const twitterHandle = site.seo?.twitterHandle
  const ogType = pageType || site.seo?.defaultOgType || 'website'
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'
  const gaId = site.analytics?.googleAnalytics
  const cssPath = site.assets?.cssPath ?? withBase(site, '/assets/style.css')
  const jsPath = site.assets?.jsPath
  const searchEnabled = site.search?.enabled === true
  const baseUrl = site.baseUrl?.replace(/\/+$/, '') ?? ''

  return (
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}

        {/* Canonical URL */}
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

        {/* OpenGraph */}
        <meta property="og:type" content={ogType} />
        {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        {image ? (
          <meta
            property="og:image"
            content={image.startsWith('http') ? image : `${origin}${image}`}
          />
        ) : null}
        <meta property="og:locale" content={locale} />
        <meta property="og:site_name" content={site.name} />

        {/* Twitter Card */}
        <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
        {twitterHandle ? <meta name="twitter:site" content={twitterHandle} /> : null}
        <meta name="twitter:title" content={title} />
        {description ? <meta name="twitter:description" content={description} /> : null}
        {image ? (
          <meta
            name="twitter:image"
            content={image.startsWith('http') ? image : `${origin}${image}`}
          />
        ) : null}

        {/* Theme color */}
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content={darkColor} />

        {/* CSS */}
        <link rel="stylesheet" href={`${baseUrl}/assets/fonts.css`} />
        <link rel="stylesheet" href={cssPath} />
        {searchEnabled ? (
          <link rel="stylesheet" href={`${baseUrl}/pagefind/pagefind-ui.css`} />
        ) : null}

        {/* Remove no-js class */}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />

        {/* Pagefind JS */}
        {searchEnabled ? <script src={`${baseUrl}/pagefind/pagefind-ui.js`} defer /> : null}
        {searchEnabled ? (
          <noscript>
            <style innerHTML=".site-search-trigger{display:none!important}" />
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
        {hasLeftSidebar ? <input type="checkbox" id="sidebar-toggle" class="sr-only" /> : null}
        {children}
        {searchEnabled ? (
          <dialog
            class="site-search-modal"
            id="search-modal"
            aria-label="Search site"
            data-search-show-images={site.search?.showImages ? 'true' : 'false'}
          >
            <div class="site-search-modal-inner">
              <div class="site-search-modal-header">
                <span class="site-search-modal-title">Search</span>
                <button
                  type="button"
                  class="site-search-modal-close"
                  aria-label="Close search"
                  data-search-close=""
                  innerHTML='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'
                />
              </div>
              <div class="site-search-modal-body" data-pagefind-search="" />
            </div>
          </dialog>
        ) : null}
        {jsPath ? <script src={jsPath} defer /> : null}
      </body>
    </html>
  )
}
