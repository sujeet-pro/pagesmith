import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { SiteConfig } from '../types'

type Props = {
  site: SiteConfig
  slug: string
  hasLeftSidebar?: boolean
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

export function Header({ site, slug, hasLeftSidebar }: Props) {
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
          <a href="/" class="site-logo">
            {site.name}
          </a>
        </div>
        <div class="header-nav-group">
          <nav class="site-nav">
            {site.navItems.map((item) => (
              <a href={item.path} class={slug.startsWith(item.path) ? 'active' : ''}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
