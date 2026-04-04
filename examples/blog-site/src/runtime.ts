/**
 * Runtime entry -- browser only.
 *
 * Progressive enhancements on top of static HTML.
 * The site works without JS -- this adds TOC highlighting, search, and sidebar.
 */

// ── TOC highlight on scroll ──
{
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]')
  if (tocLinks.length > 0) {
    const headingIds = [...tocLinks].map((a) => a.getAttribute('href')!.slice(1))
    const visibleIds = new Set<string>()

    function updateActive() {
      let activeId: string | null = null
      for (const id of headingIds) {
        if (visibleIds.has(id)) {
          activeId = id
          break
        }
      }
      for (const link of tocLinks) {
        const li = link.closest('.doc-toc-item')
        if (li) {
          li.classList.toggle('active', link.getAttribute('href') === `#${activeId}`)
        }
      }
      const activeItem = document.querySelector('.doc-aside .doc-toc-item.active a')
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id)
          } else {
            visibleIds.delete(entry.target.id)
          }
        }
        updateActive()
      },
      { rootMargin: '-80px 0px -40% 0px', threshold: 0 },
    )
    for (const id of headingIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }
}

// ── Search modal ──
{
  const modal = document.getElementById('search-modal') as HTMLDialogElement | null
  const trigger = document.querySelector('[data-search-trigger]')
  const closeBtn = document.querySelector('[data-search-close]')

  if (modal && trigger) {
    let initialized = false

    function openSearch() {
      modal!.showModal()
      if (!initialized && typeof (window as any).PagefindUI !== 'undefined') {
        new (window as any).PagefindUI({
          element: '#search-container',
          showImages: false,
          showSubResults: true,
          resetStyles: false,
        })
        initialized = true
      }
      requestAnimationFrame(() => {
        modal!.querySelector<HTMLInputElement>('.pagefind-ui__search-input')?.focus()
      })
    }

    trigger.addEventListener('click', openSearch)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close()
    })
    closeBtn?.addEventListener('click', () => modal.close())

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (modal.open) {
          modal.close()
        } else {
          openSearch()
        }
      }
    })
  }
}

// ── Sidebar modal ──
{
  const sidebarModal = document.getElementById('sidebar-modal') as HTMLDialogElement | null
  const sidebarToggle = document.querySelector('[data-sidebar-toggle]')

  if (sidebarModal && sidebarToggle) {
    function openSidebar() {
      sidebarModal!.showModal()
      document.body.style.overflow = 'hidden'
    }

    function closeSidebar() {
      sidebarModal!.close()
      document.body.style.overflow = ''
    }

    sidebarToggle.addEventListener('click', openSidebar)

    sidebarModal.querySelectorAll('[data-sidebar-close]').forEach((el) => {
      el.addEventListener('click', closeSidebar)
    })

    sidebarModal.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) {
        closeSidebar()
      }
    })

    sidebarModal.addEventListener('cancel', () => {
      document.body.style.overflow = ''
    })
  }
}

// ── Sidebar scroll to current ──
{
  const active = document.querySelector('.doc-sidebar-item.active .doc-sidebar-link')
  if (active) {
    active.scrollIntoView({ block: 'center' })
  }
}
