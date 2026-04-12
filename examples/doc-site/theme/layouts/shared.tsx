import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { Heading } from '@pagesmith/core/schemas'

/**
 * Shared chrome for this example’s `DocHome` / `DocPage` overrides.
 *
 * Why: both layouts must stay aligned on navigation, search affordances, sidebar
 * rules, and footer legals without copy-pasting JSX. Centralizing that here keeps
 * behavior easy to diff against upstream `@pagesmith/docs` defaults. Article-level
 * wrappers (including `data-pagefind-body`) stay in each layout so indexing still
 * targets the prose surface, not the global header/footer.
 */

type NavItem = {
  label: string
  path: string
}

type FooterLink = {
  label: string
  path: string
}

type FooterLinkGroup = {
  header?: string
  links: FooterLink[]
}

type FooterLinks = FooterLink[] | FooterLinkGroup[]

type SidebarItem = {
  title: string
  path: string
  children?: SidebarItem[]
}

type SidebarSection = {
  title: string
  collapsed?: boolean
  items: SidebarItem[]
}

type FooterCopyright = {
  projectName: string
  startYear: number
  endYear?: number
}

type PageLink = {
  title: string
  path: string
}

type Maintainer = {
  name: string
  link?: string
}

export type ExampleSite = {
  name: string
  title: string
  description: string
  origin: string
  basePath?: string
  homeLink?: string
  language?: string
  icon?: string | false
  navItems?: NavItem[]
  footerLinks?: FooterLinks
  footerText?: string
  maintainer?: Maintainer
  copyright?: FooterCopyright
  sidebar?: {
    collapsible?: boolean
  }
  search?: {
    enabled?: boolean
    showImages?: boolean
    showSubResults?: boolean
  }
  seo?: {
    locale?: string
    twitterHandle?: string
    defaultOgType?: string
  }
  analytics?: {
    googleAnalytics?: string
  }
  socialImage?: string
  favicon?: string | false
  faviconFallback?: string | false
  appleTouchIcon?: string | false
  theme?: {
    lightColor?: string
    darkColor?: string
    defaultColorScheme?: string
    defaultTheme?: string
  }
  [key: string]: any
}

type DocHeaderProps = {
  siteName: string
  siteIcon?: string | false
  basePath?: string
  homeLink?: string
  navItems?: NavItem[]
  slug: string
  searchEnabled?: boolean
}

type DocSidebarProps = {
  sections?: SidebarSection[]
  currentSlug?: string
  collapsible?: boolean
}

type DocTOCProps = {
  headings: Heading[]
  title?: string
}

type DocFooterProps = {
  links?: FooterLinks
  footerText?: string
  maintainer?: Maintainer
  copyright?: FooterCopyright
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
  prev?: PageLink
  next?: PageLink
}

const PAGESMITH_URL = 'https://projects.sujeet.pro/pagesmith/'
const FOOTER_YEAR_ID = 'pagesmith-footer-year-end'
const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, '')
  return normalized === '' ? '/' : normalized
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function isExternalUrl(path: string): boolean {
  return /^https?:\/\//i.test(path) || path.startsWith('//')
}

function getExternalLinkProps(path: string) {
  return isExternalUrl(path) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function isSectionActive(items: SidebarItem[], currentSlug: string): boolean {
  const current = normalizePath(currentSlug)
  for (const item of items) {
    const itemPath = normalizePath(item.path)
    if (current === itemPath || current.startsWith(itemPath + '/')) return true
    if (item.children && isSectionActive(item.children, current)) return true
  }
  return false
}

function renderSidebarItems(items: SidebarItem[], currentSlug: string, depth: number = 0): any {
  const current = normalizePath(currentSlug)

  return (
    <ul class={`doc-sidebar-list ${depth > 0 ? 'doc-sidebar-nested' : ''}`}>
      {items.map((item) => {
        const itemPath = normalizePath(item.path)
        const isActive = current === itemPath
        const hasChildren = item.children && item.children.length > 0
        const isExpanded =
          hasChildren &&
          item.children!.some((child) => {
            const childPath = normalizePath(child.path)
            return current === childPath || current.startsWith(childPath + '/')
          })

        return (
          <li
            class={`doc-sidebar-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
          >
            <a href={item.path + '/'} class="doc-sidebar-link">
              {item.title}
            </a>
            {hasChildren ? renderSidebarItems(item.children!, currentSlug, depth + 1) : null}
          </li>
        )
      })}
    </ul>
  )
}

function isFooterLinkGroup(link: FooterLink | FooterLinkGroup): link is FooterLinkGroup {
  return 'links' in link
}

function isGroupedFooterLinks(links: FooterLinks): links is FooterLinkGroup[] {
  return links.length > 0 && isFooterLinkGroup(links[0]!)
}

function getFooterGridStyle(columnCount: number): string {
  const desktopColumns = Math.min(Math.max(columnCount, 1), 4)
  const compactColumns = Math.min(desktopColumns, 2)
  return `--doc-footer-columns:${desktopColumns};--doc-footer-columns-compact:${compactColumns}`
}

function FooterThemeControls() {
  return (
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
          <button type="button" data-size="small" aria-pressed="false" aria-label="Small text">
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
          <button type="button" data-size="large" aria-pressed="false" aria-label="Large text">
            <span class="doc-text-size-label" data-size="large">
              A
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

/** Prefixes absolute paths with `site.basePath` so links and images work when hosted under a subpath. */
export function withSiteBase(basePath: string | undefined, path: string): string {
  if (!path.startsWith('/')) return path
  const base = (basePath || '').replace(/\/+$/, '')
  return base ? `${base}${path}` : path
}

export function resolveSocialImage(site: ExampleSite, socialImage?: string): string | undefined {
  if (!socialImage) return undefined
  if (socialImage.startsWith('http')) return socialImage
  return withSiteBase(site.basePath, `/${socialImage.replace(/^\//, '')}`)
}

/**
 * `Html` only needs the upstream docs-package site contract; keep richer example-only
 * fields like grouped footer links on `ExampleSite` without widening the package prop.
 */
export function toHtmlSite(site: ExampleSite) {
  return {
    origin: site.origin,
    basePath: site.basePath,
    name: site.name,
    language: site.language,
    seo: site.seo,
    theme: site.theme,
    analytics: site.analytics,
    search: site.search,
    socialImage: site.socialImage,
    favicon: site.favicon,
    faviconFallback: site.faviconFallback,
    appleTouchIcon: site.appleTouchIcon,
  }
}

/** Mirrors primary nav as a simple sidebar on the home layout (optional UX nicety for wide screens). */
export function buildHomeSidebarSections(navItems?: NavItem[]): SidebarSection[] | undefined {
  if (!navItems || navItems.length === 0) return undefined
  return [
    {
      title: 'Navigation',
      items: navItems.map((item) => ({
        title: item.label,
        path: item.path,
      })),
    },
  ]
}

/** Top bar: skip link, mobile sidebar toggle, branding, section nav, Pagefind trigger, theme menu. */
export function DocHeader({
  siteName,
  siteIcon,
  basePath,
  homeLink,
  navItems,
  slug,
  searchEnabled,
}: DocHeaderProps) {
  const homePath = homeLink || (basePath ? `${basePath}/` : '/')
  const hasNav = navItems && navItems.length > 0
  const base = (basePath || '').replace(/\/+$/, '')

  function isNavActive(itemPath: string): boolean {
    const relative = itemPath.startsWith(base) ? itemPath.slice(base.length) : itemPath
    const section = relative.replace(/^\//, '').split('/')[0]
    return slug.startsWith(`${base}/${section}`)
  }

  return (
    <header class="doc-header">
      <a
        href="#doc-main-content"
        class="doc-skip-link"
        onclick="document.getElementById('doc-main-content')?.focus()"
      >
        Skip to main content
      </a>
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
        <div class="doc-header-right">
          {searchEnabled ? <pagefind-modal-trigger class="doc-search-trigger" /> : null}
          <div class="doc-theme-toggle no-js-hidden" data-theme-toggle="">
            <button
              type="button"
              class="doc-theme-toggle-btn"
              aria-label="Change theme"
              aria-expanded="false"
              aria-haspopup="true"
              aria-controls="doc-theme-dropdown"
              data-theme-toggle-btn=""
              innerHTML={themeIcon}
            />
            <div id="doc-theme-dropdown" class="doc-theme-dropdown" data-theme-dropdown="" hidden>
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
                    <input class="sr-only" type="radio" name="textSize" value="small" />
                    <span class="doc-text-size-label" data-size="small" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Small text size</span>
                  </label>
                  <label class="doc-text-size-option" title="Default">
                    <input class="sr-only" type="radio" name="textSize" value="base" checked />
                    <span class="doc-text-size-label" data-size="base" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Default text size</span>
                  </label>
                  <label class="doc-text-size-option" title="Large">
                    <input class="sr-only" type="radio" name="textSize" value="large" />
                    <span class="doc-text-size-label" data-size="large" aria-hidden="true">
                      A
                    </span>
                    <span class="sr-only">Large text size</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/** Folder-driven sidebar sections; supports collapsible `<details>` when enabled in config. */
export function DocSidebar({ sections, currentSlug = '/', collapsible = false }: DocSidebarProps) {
  if (!sections || sections.length === 0) return <Fragment />

  return (
    <aside class="doc-sidebar">
      <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
        {sections.map((section) => {
          const sectionActive = isSectionActive(section.items, currentSlug)
          const isOpen = !section.collapsed || sectionActive

          if (collapsible) {
            return (
              <details
                class="doc-sidebar-section doc-sidebar-collapsible"
                open={isOpen || undefined}
              >
                <summary class="doc-sidebar-heading">{section.title}</summary>
                {renderSidebarItems(section.items, currentSlug)}
              </details>
            )
          }

          return (
            <div class="doc-sidebar-section">
              <p class="doc-sidebar-heading">{section.title}</p>
              {renderSidebarItems(section.items, currentSlug)}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

/** Limits TOC depth so h4+ noise does not overwhelm the aside/mobile summary. */
export function DocTOC({ headings, title = 'On this page' }: DocTOCProps) {
  const filtered = headings.filter((heading) => heading.depth >= 2 && heading.depth <= 3)
  if (filtered.length === 0) return <Fragment />

  return (
    <nav class="doc-toc" aria-label="Table of contents">
      <p class="doc-toc-title">{title}</p>
      <ul class="doc-toc-list">
        {filtered.map((heading) => (
          <li class={`doc-toc-item depth-${heading.depth}`}>
            <a href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Page meta (edit/last updated), prev/next, grouped footer links, theme controls, copyright. */
export function DocFooter({
  links,
  footerText,
  maintainer,
  copyright,
  editUrl,
  editLabel,
  lastUpdated,
  prev,
  next,
}: DocFooterProps) {
  const buildYear = new Date().getFullYear()
  const hasPageMeta = editUrl || lastUpdated
  const hasPrevNext = prev || next
  const hasLinks = !!links && links.length > 0
  const groupedLinks =
    hasLinks && links ? (isGroupedFooterLinks(links) ? links : undefined) : undefined
  const flatLinks = hasLinks && links && !groupedLinks ? (links as FooterLink[]) : undefined
  const flatLinkGridStyle = flatLinks ? getFooterGridStyle(flatLinks.length) : undefined
  const groupedLinkGridStyle = groupedLinks ? getFooterGridStyle(groupedLinks.length) : undefined
  const renderedEndYear = copyright
    ? Math.max(copyright.endYear ?? buildYear, copyright.startYear)
    : undefined
  const showCopyrightRange =
    copyright && renderedEndYear !== undefined ? copyright.startYear !== renderedEndYear : false
  const autoUpdateCopyrightYear = !!copyright && copyright.endYear === undefined
  const signoff = footerText ? (
    footerText
  ) : (
    <>
      Made with <span aria-hidden="true">&#10084;</span> using{' '}
      <a href={PAGESMITH_URL} target="_blank" rel="noopener noreferrer">
        Pagesmith
      </a>
      {maintainer ? (
        <span>
          {' '}
          and is maintained by{' '}
          {maintainer.link ? (
            <a href={maintainer.link} {...getExternalLinkProps(maintainer.link)}>
              {maintainer.name}
            </a>
          ) : (
            maintainer.name
          )}
        </span>
      ) : null}
    </>
  )

  return (
    <footer class="doc-footer">
      {hasPageMeta ? (
        <div class="doc-page-meta">
          {editUrl ? (
            <a href={editUrl} class="doc-edit-link" target="_blank" rel="noopener noreferrer">
              {editLabel || 'Edit this page'}
            </a>
          ) : null}
          {lastUpdated ? (
            <span class="doc-last-updated">
              Last updated: <time datetime={lastUpdated}>{formatDate(lastUpdated)}</time>
            </span>
          ) : null}
        </div>
      ) : null}
      {hasPrevNext ? (
        <nav class="doc-article-nav" aria-label="Page navigation">
          {prev ? (
            <a href={prev.path + '/'} class="doc-article-link doc-article-prev">
              <span class="doc-article-label">Previous</span>
              <span class="doc-article-title">{prev.title}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={next.path + '/'} class="doc-article-link doc-article-next">
              <span class="doc-article-label">Next</span>
              <span class="doc-article-title">{next.title}</span>
            </a>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
      {flatLinks ? (
        <nav
          class="doc-footer-links doc-footer-links-flat"
          aria-label="Footer links"
          style={flatLinkGridStyle}
        >
          {flatLinks.map((link) => (
            <a class="doc-footer-link-item" href={link.path} {...getExternalLinkProps(link.path)}>
              <span class="doc-footer-link-label">{link.label}</span>
            </a>
          ))}
        </nav>
      ) : null}
      {groupedLinks ? (
        <nav
          class="doc-footer-links doc-footer-links-grouped"
          aria-label="Footer links"
          style={groupedLinkGridStyle}
        >
          {groupedLinks.map((group) => (
            <div class="doc-footer-link-group">
              {group.header ? <p class="doc-footer-link-group-header">{group.header}</p> : null}
              <div class="doc-footer-link-group-links">
                {group.links.map((link) => (
                  <a
                    class="doc-footer-group-link"
                    href={link.path}
                    {...getExternalLinkProps(link.path)}
                  >
                    <span class="doc-footer-link-label">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      ) : null}
      <FooterThemeControls />
      <div class="doc-footer-legal">
        {copyright && renderedEndYear !== undefined ? (
          <p class="doc-footer-copyright">
            &copy;{' '}
            <span class="doc-footer-year-range" data-current-year-range="">
              <span
                class="doc-footer-year-start"
                hidden={!showCopyrightRange}
                aria-hidden={showCopyrightRange ? undefined : 'true'}
              >
                {copyright.startYear}
              </span>
              <span
                class="doc-footer-year-separator"
                aria-hidden="true"
                hidden={!showCopyrightRange}
              >
                &ndash;
              </span>
              <span
                id={FOOTER_YEAR_ID}
                data-start-year={String(copyright.startYear)}
                data-rendered-year={String(renderedEndYear)}
                data-auto-update={String(autoUpdateCopyrightYear)}
              >
                {renderedEndYear}
              </span>
            </span>{' '}
            {copyright.projectName}
          </p>
        ) : null}
        <p class="doc-footer-signoff">
          {copyright ? (
            <span class="doc-footer-legal-separator" aria-hidden="true">
              |
            </span>
          ) : null}
          {signoff}
        </p>
      </div>
    </footer>
  )
}
