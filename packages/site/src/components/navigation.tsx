import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from './assets.js'
import { ThemeDropdownControls } from './theme.js'
import type {
  Heading,
  SiteBreadcrumb,
  SiteNavItem,
  SiteSidebarItem,
  SiteSidebarSection,
  SiteThemeControls,
} from './types.js'
import { formatPath, normalizePath } from './utils.js'

const hamburgerIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'

const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'

type BreadcrumbsProps = {
  breadcrumbs?: SiteBreadcrumb[]
  trailingSlash?: boolean
}

function BreadcrumbsComponent({ breadcrumbs, trailingSlash }: BreadcrumbsProps) {
  if (!breadcrumbs || breadcrumbs.length === 0) return <Fragment />

  return (
    <nav class="doc-breadcrumbs" aria-label="Breadcrumbs">
      {breadcrumbs.map((crumb, index) => (
        <Fragment>
          {index > 0 ? (
            <span class="doc-breadcrumb-sep" aria-hidden="true">
              /
            </span>
          ) : null}
          {crumb.path ? (
            <a href={formatPath(crumb.path, trailingSlash)}>{crumb.label}</a>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

type TableOfContentsProps = {
  headings: Heading[]
  title?: string
  minDepth?: number
  maxDepth?: number
}

function TableOfContentsComponent({
  headings,
  title = 'On this page',
  minDepth = 2,
  maxDepth = 3,
}: TableOfContentsProps) {
  const filtered = headings.filter(
    (heading) => heading.depth >= minDepth && heading.depth <= maxDepth,
  )
  if (filtered.length === 0) return <Fragment />

  return (
    <nav class="doc-toc" aria-label="Table of contents" data-ps-toc="">
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

type AccordionTableOfContentsProps = TableOfContentsProps & {
  summaryLabel?: string
  open?: boolean
}

function AccordionTableOfContentsComponent({
  headings,
  title,
  minDepth,
  maxDepth,
  summaryLabel = 'On this page',
  open = false,
}: AccordionTableOfContentsProps) {
  const filtered = headings.filter(
    (heading) => heading.depth >= (minDepth ?? 2) && heading.depth <= (maxDepth ?? 3),
  )
  if (filtered.length === 0) return <Fragment />

  return (
    <details class="doc-toc-mobile" open={open || undefined}>
      <summary>{summaryLabel}</summary>
      <TableOfContentsComponent
        headings={headings}
        title={title}
        minDepth={minDepth}
        maxDepth={maxDepth}
      />
    </details>
  )
}

function isSectionActive(items: SiteSidebarItem[], currentPath: string): boolean {
  for (const item of items) {
    const itemPath = normalizePath(item.path)
    if (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)) return true
    if (item.children && isSectionActive(item.children, currentPath)) return true
  }
  return false
}

function renderSidebarItems(
  items: SiteSidebarItem[],
  currentPath: string,
  depth = 0,
  trailingSlash?: boolean,
): unknown {
  return (
    <ul class={`doc-sidebar-list ${depth > 0 ? 'doc-sidebar-nested' : ''}`}>
      {items.map((item) => {
        const itemPath = normalizePath(item.path)
        const isActive = currentPath === itemPath
        const hasChildren = !!item.children?.length
        const isExpanded =
          hasChildren &&
          item.children!.some((child) => {
            const childPath = normalizePath(child.path)
            return currentPath === childPath || currentPath.startsWith(`${childPath}/`)
          })

        return (
          <li
            class={`doc-sidebar-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
          >
            <a href={formatPath(item.path, trailingSlash)} class="doc-sidebar-link">
              {item.title}
            </a>
            {hasChildren
              ? renderSidebarItems(item.children!, currentPath, depth + 1, trailingSlash)
              : null}
          </li>
        )
      })}
    </ul>
  )
}

function renderSidebarSections(
  sections: SiteSidebarSection[],
  currentPath: string,
  collapsible: boolean,
  navLabel: string,
  trailingSlash?: boolean,
) {
  return (
    <nav class="doc-sidebar-nav" aria-label={navLabel}>
      {sections.map((section) => {
        const sectionActive = isSectionActive(section.items, currentPath)
        const isOpen = !section.collapsed || sectionActive

        if (collapsible) {
          return (
            <details class="doc-sidebar-section doc-sidebar-collapsible" open={isOpen || undefined}>
              <summary class="doc-sidebar-heading">{section.title}</summary>
              {renderSidebarItems(section.items, currentPath, 0, trailingSlash)}
            </details>
          )
        }

        return (
          <div class="doc-sidebar-section">
            <p class="doc-sidebar-heading">{section.title}</p>
            {renderSidebarItems(section.items, currentPath, 0, trailingSlash)}
          </div>
        )
      })}
    </nav>
  )
}

type SiteSidebarProps = {
  sections?: SiteSidebarSection[]
  currentSlug?: string
  currentPath?: string
  collapsible?: boolean
  navLabel?: string
  trailingSlash?: boolean
}

function SiteSidebarComponent({
  sections,
  currentSlug,
  currentPath,
  collapsible = false,
  navLabel = 'Documentation navigation',
  trailingSlash,
}: SiteSidebarProps) {
  if (!sections || sections.length === 0) return <Fragment />
  const resolvedPath = normalizePath(currentPath ?? currentSlug ?? '/')

  return (
    <aside class="doc-sidebar">
      {renderSidebarSections(sections, resolvedPath, collapsible, navLabel, trailingSlash)}
    </aside>
  )
}

export function buildSidebarModalSections(
  navItems?: SiteNavItem[],
  sections?: SiteSidebarSection[],
  navigationTitle = 'Navigation',
): SiteSidebarSection[] {
  const resolvedSections = sections ? [...sections] : []
  if (!navItems || navItems.length === 0) return resolvedSections

  const hasNavigationSection = resolvedSections.some((section) => section.title === navigationTitle)
  if (hasNavigationSection) return resolvedSections

  return [
    {
      title: navigationTitle,
      slug: 'navigation',
      items: navItems.map((item) => ({ title: item.label, path: item.path })),
    },
    ...resolvedSections,
  ]
}

type SiteSidebarModalProps = {
  sections?: SiteSidebarSection[]
  navItems?: SiteNavItem[]
  currentSlug?: string
  currentPath?: string
  collapsible?: boolean
  navLabel?: string
  navigationTitle?: string
  id?: string
  trailingSlash?: boolean
}

function SiteSidebarModalComponent({
  sections,
  navItems,
  currentSlug,
  currentPath,
  collapsible = false,
  navLabel = 'Navigation',
  navigationTitle = 'Navigation',
  id = 'sidebar-modal',
  trailingSlash,
}: SiteSidebarModalProps) {
  const resolvedSections = buildSidebarModalSections(navItems, sections, navigationTitle)
  if (resolvedSections.length === 0) return <Fragment />
  const resolvedPath = normalizePath(currentPath ?? currentSlug ?? '/')

  return (
    <dialog class="doc-sidebar-modal" id={id} data-sidebar-modal="">
      <div class="doc-sidebar-modal-backdrop" data-sidebar-close="" />
      <div class="doc-sidebar-modal-panel">
        <button
          type="button"
          class="doc-sidebar-modal-close"
          data-sidebar-close=""
          aria-label="Close navigation"
          innerHTML={closeIcon}
        />
        {renderSidebarSections(
          resolvedSections,
          resolvedPath,
          collapsible,
          navLabel,
          trailingSlash,
        )}
      </div>
    </dialog>
  )
}

type SiteHeaderProps = {
  siteName: string
  siteIcon?: string | false
  basePath?: string
  homeLink?: string
  navItems?: SiteNavItem[]
  slug?: string
  currentPath?: string
  searchEnabled?: boolean
  themeControls?: SiteThemeControls
  trailingSlash?: boolean
  navAriaLabel?: string
  skipLinkTargetId?: string
  skipLinkText?: string
  showSidebarToggle?: boolean
  sidebarToggleLabel?: string
  sidebarDialogId?: string
}

function SiteHeaderComponent({
  siteName,
  siteIcon,
  basePath,
  homeLink,
  navItems,
  slug,
  currentPath,
  searchEnabled,
  themeControls,
  trailingSlash,
  navAriaLabel = 'Primary navigation',
  skipLinkTargetId = 'doc-main-content',
  skipLinkText = 'Skip to main content',
  showSidebarToggle,
  sidebarToggleLabel = 'Toggle navigation',
  sidebarDialogId = 'sidebar-modal',
}: SiteHeaderProps) {
  const homePath = homeLink || basePath || '/'
  const hasNav = !!navItems?.length
  const resolvedPath = normalizePath(currentPath ?? slug ?? '/')
  const base = normalizePath(basePath || '/')
  const shouldShowSidebarToggle = showSidebarToggle ?? hasNav

  function isNavActive(itemPath: string): boolean {
    const normalizedItemPath = normalizePath(itemPath)
    if (base !== '/' && normalizedItemPath.startsWith(base)) {
      const relative = normalizedItemPath.slice(base.length).replace(/^\//, '')
      const section = relative.split('/')[0]
      return section ? resolvedPath.startsWith(`${base}/${section}`) : resolvedPath === base
    }

    const relative = normalizedItemPath.replace(/^\//, '')
    const section = relative.split('/')[0]
    return section ? resolvedPath.startsWith(`/${section}`) : resolvedPath === '/'
  }

  return (
    <header class="doc-header">
      <a
        href={`#${skipLinkTargetId}`}
        class="doc-skip-link"
        data-skip-link=""
        onclick={`document.getElementById('${skipLinkTargetId}')?.focus()`}
      >
        {skipLinkText}
      </a>
      <div class="doc-header-inner">
        <div class="doc-header-left">
          {shouldShowSidebarToggle ? (
            <button
              type="button"
              class="doc-sidebar-toggle"
              aria-label={sidebarToggleLabel}
              aria-controls={sidebarDialogId}
              aria-expanded="false"
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
          <nav class="doc-nav" aria-label={navAriaLabel}>
            {navItems!.map((item) => (
              <a
                href={formatPath(item.path, trailingSlash)}
                class={isNavActive(item.path) ? 'active' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div class="doc-header-right">
          {searchEnabled ? <pagefind-modal-trigger class="doc-search-trigger" /> : null}
          <ThemeDropdownControls controls={themeControls} />
        </div>
      </div>
    </header>
  )
}

export const Breadcrumbs = withComponentAssets(BreadcrumbsComponent, SITE_CHROME_ASSETS)
export const TableOfContents = withComponentAssets(TableOfContentsComponent, SITE_CHROME_ASSETS)
export const AccordionTableOfContents = withComponentAssets(
  AccordionTableOfContentsComponent,
  SITE_CHROME_ASSETS,
)
export const SiteSidebar = withComponentAssets(SiteSidebarComponent, SITE_CHROME_ASSETS)
export const SiteSidebarModal = withComponentAssets(SiteSidebarModalComponent, SITE_CHROME_ASSETS)
export const SiteHeader = withComponentAssets(SiteHeaderComponent, SITE_CHROME_ASSETS)
