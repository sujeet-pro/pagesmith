/**
 * Sidebar modal — JS-powered overlay for mobile/tablet.
 *
 * Clones the .doc-sidebar nav content into a slide-in modal panel,
 * and prepends top-level nav links (Guide, Reference, etc.) as a
 * "Navigation" section so mobile users can reach all sections.
 */

const closeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>'

function buildNavSection(): HTMLElement | null {
  const docNav = document.querySelector('.doc-nav')
  if (!docNav) return null

  const links = docNav.querySelectorAll('a')
  if (links.length === 0) return null

  const section = document.createElement('div')
  section.className = 'doc-sidebar-section'

  const heading = document.createElement('p')
  heading.className = 'doc-sidebar-heading'
  heading.textContent = 'Navigation'
  section.appendChild(heading)

  const list = document.createElement('ul')
  list.className = 'doc-sidebar-list'

  links.forEach((link) => {
    const li = document.createElement('li')
    li.className = 'doc-sidebar-item'
    if (link.classList.contains('active')) li.classList.add('active')

    const a = document.createElement('a')
    a.href = link.href
    a.className = 'doc-sidebar-link'
    a.textContent = link.textContent
    li.appendChild(a)
    list.appendChild(li)
  })

  section.appendChild(list)
  return section
}

function createModal(sidebarNav: Element | null): HTMLElement {
  const modal = document.createElement('div')
  modal.className = 'doc-sidebar-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-label', 'Navigation')

  const backdrop = document.createElement('div')
  backdrop.className = 'doc-sidebar-modal-backdrop'

  const panel = document.createElement('div')
  panel.className = 'doc-sidebar-modal-panel'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'doc-sidebar-modal-close'
  closeBtn.setAttribute('aria-label', 'Close navigation')
  closeBtn.innerHTML = closeIcon

  panel.appendChild(closeBtn)

  // Build the modal nav container
  const nav = document.createElement('nav')
  nav.className = 'doc-sidebar-nav'
  nav.setAttribute('aria-label', 'Navigation')

  // Clone the sidebar nav sections (skip the outer <nav>, just grab sections)
  const hasExistingNav =
    sidebarNav?.querySelector('.doc-sidebar-heading')?.textContent === 'Navigation'
  if (sidebarNav) {
    for (const child of Array.from(sidebarNav.children)) {
      nav.appendChild(child.cloneNode(true))
    }
  }

  // Add top-level nav links as "Navigation" section (skip if sidebar already has one)
  if (!hasExistingNav) {
    const navSection = buildNavSection()
    if (navSection) nav.prepend(navSection)
  }

  panel.appendChild(nav)
  modal.appendChild(backdrop)
  modal.appendChild(panel)
  document.body.appendChild(modal)

  return modal
}

export function initSidebar(): void {
  const toggle = document.querySelector('[data-sidebar-toggle]') as HTMLElement | null
  if (!toggle) return

  const sidebarNav = document.querySelector('.doc-sidebar-nav')

  const modal = createModal(sidebarNav)
  const closeBtn = modal.querySelector<HTMLButtonElement>('.doc-sidebar-modal-close')
  const backdrop = modal.querySelector<HTMLElement>('.doc-sidebar-modal-backdrop')
  if (!closeBtn || !backdrop) return

  function open() {
    modal.setAttribute('open', '')
    document.body.style.overflow = 'hidden'
    closeBtn?.focus()
  }

  function close() {
    modal.removeAttribute('open')
    document.body.style.overflow = ''
    toggle?.focus()
  }

  toggle.addEventListener('click', open)
  closeBtn.addEventListener('click', close)
  backdrop.addEventListener('click', close)

  // Close on link click
  modal.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) {
      close()
    }
  })

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('open')) {
      close()
    }
  })
}
