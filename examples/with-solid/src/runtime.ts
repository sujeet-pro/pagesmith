/**
 * Runtime entry — browser only.
 *
 * Progressive enhancements on top of static HTML (no Solid hydration — keep DOM-only logic here).
 * The site works without JS — this adds TOC highlighting, sidebar, theme controls, and small
 * Pagefind trigger tweaks; opening the search modal is handled by Pagefind Component UI.
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

// ── Search trigger compact mode ──
{
  if (typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const sync = () => {
      document
        .querySelectorAll<HTMLElement>('pagefind-modal-trigger.doc-search-trigger')
        .forEach((trigger) => {
          if (mediaQuery.matches) {
            trigger.setAttribute('compact', '')
            trigger.setAttribute('hide-shortcut', '')
          } else {
            trigger.removeAttribute('compact')
            trigger.removeAttribute('hide-shortcut')
          }
        })
    }

    sync()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync)
    } else {
      mediaQuery.addListener(sync)
    }
  }
}

// ── Sidebar scroll to current ──
{
  const active = document.querySelector('.doc-sidebar-item.active .doc-sidebar-link')
  if (active) {
    active.scrollIntoView({ block: 'center' })
  }
}

// ── Theme switcher (header dropdown + footer buttons) ──
{
  const STORAGE_KEY = 'pagesmith-theme'

  function getPrefs() {
    const classes = document.documentElement.className
    const schemeMatch = classes.match(/color-scheme-(\w+)/)
    const themeMatch = classes.match(/theme-([\w-]+)/)
    return {
      colorScheme: schemeMatch?.[1] || 'auto',
      theme: themeMatch?.[1] || 'paper',
      textSize: document.documentElement.dataset.textSize || 'base',
    }
  }

  function setColorScheme(scheme: string) {
    document.documentElement.className = document.documentElement.className.replace(
      /color-scheme-\w+/,
      'color-scheme-' + scheme,
    )
    persist()
    syncUI()
  }

  function setTheme(theme: string) {
    document.documentElement.className = document.documentElement.className.replace(
      /theme-[\w-]+/,
      'theme-' + theme,
    )
    persist()
    syncUI()
  }

  function setTextSize(size: string) {
    if (size === 'base') {
      delete document.documentElement.dataset.textSize
    } else {
      document.documentElement.dataset.textSize = size
    }
    persist()
    syncUI()
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

    // Header dropdown radios
    document
      .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="colorScheme"]')
      .forEach((input) => {
        input.checked = input.value === prefs.colorScheme
      })
    document
      .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="theme"]')
      .forEach((input) => {
        input.checked = input.value === prefs.theme
      })
    document
      .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="textSize"]')
      .forEach((input) => {
        input.checked = input.value === prefs.textSize
      })

    // Footer scheme buttons
    document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
      const active = btn.dataset.scheme === prefs.colorScheme
      btn.classList.toggle('active', active)
      btn.setAttribute('aria-pressed', String(active))
    })

    // Footer theme buttons
    document
      .querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button')
      .forEach((btn) => {
        const active = btn.dataset.theme === prefs.theme
        btn.classList.toggle('active', active)
        btn.setAttribute('aria-pressed', String(active))
      })

    // Footer text size buttons
    document
      .querySelectorAll<HTMLButtonElement>('[data-footer-text-size] button')
      .forEach((btn) => {
        const active = btn.dataset.size === prefs.textSize
        btn.classList.toggle('active', active)
        btn.setAttribute('aria-pressed', String(active))
      })
  }

  // Header dropdown toggle
  const toggleBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle-btn]')
  const dropdown = document.querySelector<HTMLElement>('[data-theme-dropdown]')
  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', () => {
      const open = !dropdown.hidden
      dropdown.hidden = open
      toggleBtn.setAttribute('aria-expanded', String(!open))
    })

    dropdown.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement
      if (input.name === 'colorScheme') setColorScheme(input.value)
      if (input.name === 'theme') setTheme(input.value)
      if (input.name === 'textSize') setTextSize(input.value)
    })

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-theme-toggle]')) {
        dropdown.hidden = true
        toggleBtn.setAttribute('aria-expanded', 'false')
      }
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown.hidden) {
        dropdown.hidden = true
        toggleBtn.setAttribute('aria-expanded', 'false')
        toggleBtn.focus()
      }
    })
  }

  // Footer buttons
  document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.scheme) setColorScheme(btn.dataset.scheme)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.theme) setTheme(btn.dataset.theme)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-footer-text-size] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.size) setTextSize(btn.dataset.size)
    })
  })

  syncUI()
}
