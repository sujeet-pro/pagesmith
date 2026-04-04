import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  siteName: string
  siteIcon?: string | false
  basePath?: string
  homeLink?: string
  navItems?: Array<{ path: string; label: string }>
  slug: string
  searchEnabled?: boolean
}

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

const searchIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

export function DocHeader({
  siteName,
  siteIcon,
  basePath,
  homeLink,
  navItems,
  slug,
  searchEnabled,
}: Props) {
  const homePath = homeLink || (basePath ? `${basePath}/` : '/')
  const hasNav = navItems && navItems.length > 0
  const base = (basePath || '').replace(/\/+$/, '')

  function isNavActive(itemPath: string): boolean {
    // Extract the section prefix from the nav item path (e.g., /pagesmith/guide)
    const relative = itemPath.startsWith(base) ? itemPath.slice(base.length) : itemPath
    const section = relative.replace(/^\//, '').split('/')[0]
    return slug.startsWith(`${base}/${section}`)
  }

  return (
    <header class="doc-header">
      <div class="doc-header-inner">
        <div class="doc-header-left">
          {hasNav ? (
            <button
              type="button"
              class="doc-sidebar-toggle"
              aria-label="Toggle navigation"
              data-sidebar-toggle=""
              innerHTML={hamburgerIcon}
            />
          ) : null}
          <a href={homePath} class="doc-logo">
            {siteIcon !== false && siteIcon ? (
              <span class="doc-logo-icon" innerHTML={siteIcon} />
            ) : null}
            {siteName}
          </a>
        </div>
        {hasNav ? (
          <nav class="doc-nav">
            {navItems!.map((item) => (
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
  )
}
