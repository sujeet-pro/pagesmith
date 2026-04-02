import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { SiteConfig } from '../types'
import { withBase } from '../utils'

type Props = {
  site: SiteConfig
  slug: string
  hasLeftSidebar?: boolean
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m12.5 12.5 4 4" stroke-linecap="round"/></svg>'

const homeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l7-7 7 7"/><path d="M5 8.5V16a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V8.5"/></svg>'

export function Header({ site, slug, hasLeftSidebar }: Props) {
  const searchEnabled = site.search?.enabled === true

  return (
    <header class="site-header">
      <div class="header-inner">
        <div class="header-nav-group">
          {hasLeftSidebar ? (
            <label
              for="sidebar-toggle"
              class="sidebar-toggle-label"
              role="button"
              aria-label="Toggle navigation"
              innerHTML={hamburgerIcon}
            />
          ) : null}
          <a href={withBase(site, '/')} class="site-logo">
            {site.name}
          </a>
        </div>
        <div class="header-nav-group">
          <nav class="site-nav">
            <a
              href={withBase(site, '/')}
              class={`site-nav-home${slug === '/' ? ' active' : ''}`}
              aria-label="Home"
              innerHTML={homeIcon}
            />
            {site.navItems.map((item) => {
              const base = (site.baseUrl || '').replace(/\/+$/, '')
              const rel = item.path.startsWith(base) ? item.path.slice(base.length) : item.path
              const section = rel.replace(/^\//, '').split('/')[0]
              return (
                <a href={item.path} class={slug.startsWith(`${base}/${section}`) ? 'active' : ''}>
                  {item.label}
                </a>
              )
            })}
          </nav>
          {searchEnabled ? (
            <button
              type="button"
              class="site-search-trigger"
              aria-label="Search"
              data-search-open=""
            >
              <span class="site-search-icon" innerHTML={searchIcon} />
              <kbd class="site-search-kbd">⌘K</kbd>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
