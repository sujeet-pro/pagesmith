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

const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

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
          </div>
        </div>
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
