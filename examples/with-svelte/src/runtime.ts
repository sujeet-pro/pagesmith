/**
 * Runtime entry — browser only.
 *
 * Progressive enhancements on top of static HTML.
 * The site works without JS — this adds TOC highlighting, search, and sidebar.
 */

// ── TOC highlight on scroll ──
{
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]')
  if (tocLinks.length > 0) {
    const headingIds = [...tocLinks].map((a) => a.getAttribute('href')!.slice(1))
    const visibleIds = new Set<string>()

    function updateActive() {
      // Find the first heading in document order that is currently visible
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
      // Scroll active item into view in the TOC sidebar
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

    // Close on backdrop or close button click
    sidebarModal.querySelectorAll('[data-sidebar-close]').forEach((el) => {
      el.addEventListener('click', closeSidebar)
    })

    // Close on link click inside modal
    sidebarModal.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) {
        closeSidebar()
      }
    })

    // Close on Escape
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

// ── Footer theme selector ──
{
  const STORAGE_KEY = 'pagesmith-theme'

  function getPrefs() {
    const classes = document.documentElement.className
    const schemeMatch = classes.match(/color-scheme-(\w+)/)
    const themeMatch = classes.match(/theme-([\w-]+)/)
    return {
      colorScheme: schemeMatch?.[1] || 'auto',
      theme: themeMatch?.[1] || 'paper',
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getPrefs()))
    } catch {
      // localStorage unavailable
    }
  }

  function syncUI() {
    const prefs = getPrefs()
    document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
      const active = btn.dataset.scheme === prefs.colorScheme
      btn.classList.toggle('active', active)
      btn.setAttribute('aria-pressed', String(active))
    })
    document
      .querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button')
      .forEach((btn) => {
        const active = btn.dataset.theme === prefs.theme
        btn.classList.toggle('active', active)
        btn.setAttribute('aria-pressed', String(active))
      })
  }

  document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.scheme) {
        document.documentElement.className = document.documentElement.className.replace(
          /color-scheme-\w+/,
          'color-scheme-' + btn.dataset.scheme,
        )
        persist()
        syncUI()
      }
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.theme) {
        document.documentElement.className = document.documentElement.className.replace(
          /theme-[\w-]+/,
          'theme-' + btn.dataset.theme,
        )
        persist()
        syncUI()
      }
    })
  })

  syncUI()
}
