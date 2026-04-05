import { Fragment, h } from '@pagesmith/core/jsx-runtime'

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

type Props = {
  sections?: SidebarSection[]
  currentSlug?: string
  collapsible?: boolean
}

function isSectionActive(items: SidebarItem[], currentSlug: string): boolean {
  for (const item of items) {
    if (currentSlug === item.path || currentSlug.startsWith(item.path + '/')) return true
    if (item.children && isSectionActive(item.children, currentSlug)) return true
  }
  return false
}

function renderItems(items: SidebarItem[], currentSlug: string, depth: number = 0): any {
  return (
    <ul class={`doc-sidebar-list ${depth > 0 ? 'doc-sidebar-nested' : ''}`}>
      {items.map((item) => {
        const isActive = currentSlug === item.path
        const hasChildren = item.children && item.children.length > 0
        const isExpanded =
          hasChildren &&
          item.children!.some(
            (child) => currentSlug === child.path || currentSlug.startsWith(child.path + '/'),
          )

        return (
          <li
            class={`doc-sidebar-item ${isActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
          >
            <a href={item.path + '/'} class="doc-sidebar-link">
              {item.title}
            </a>
            {hasChildren ? renderItems(item.children!, currentSlug, depth + 1) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function DocSidebar({ sections, currentSlug = '/', collapsible = false }: Props) {
  if (!sections || sections.length === 0) return <Fragment />

  return (
    <aside class="doc-sidebar">
      <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
        {sections.map((section) => {
          const sectionActive = isSectionActive(section.items, currentSlug)
          // Section is open if: explicitly not collapsed, or contains the active page
          const isOpen = !section.collapsed || sectionActive

          if (collapsible) {
            return (
              <details
                class="doc-sidebar-section doc-sidebar-collapsible"
                open={isOpen || undefined}
              >
                <summary class="doc-sidebar-heading">{section.title}</summary>
                {renderItems(section.items, currentSlug)}
              </details>
            )
          }

          return (
            <div class="doc-sidebar-section">
              <p class="doc-sidebar-heading">{section.title}</p>
              {renderItems(section.items, currentSlug)}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
