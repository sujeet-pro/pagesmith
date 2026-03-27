import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  siteName: string
  basePath?: string
  navItems?: Array<{ path: string; label: string }>
  slug: string
  searchEnabled?: boolean
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

export function DocHeader({ siteName, basePath, navItems, slug, searchEnabled }: Props) {
  const homePath = basePath ? `${basePath}/` : '/'

  return (
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
          <a href={homePath} class="doc-logo">
            {siteName}
          </a>
        </div>
        {navItems && navItems.length > 0 ? (
          <nav class="doc-nav">
            {navItems.map((item) => (
              <a href={item.path} class={slug.startsWith(item.path) ? 'active' : ''}>
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        {searchEnabled ? <div id="search" class="doc-search" data-pagefind-search="" /> : null}
      </div>
    </header>
  )
}
