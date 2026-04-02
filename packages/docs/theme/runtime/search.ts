/**
 * Search modal toggle and keyboard shortcut.
 *
 * Opens a <dialog> containing Pagefind UI. PagefindUI is lazily
 * initialized on first open so the main bundle stays small.
 */

declare const PagefindUI: any

export function initSearch(): void {
  const trigger = document.querySelector('[data-search-trigger]') as HTMLElement | null
  const modal = document.getElementById('search-modal') as HTMLDialogElement | null
  const closeBtn = document.querySelector('[data-search-close]') as HTMLElement | null
  if (!trigger || !modal) return

  let initialized = false

  const showImages = modal.dataset.searchShowImages === 'true'
  const showSubResults = modal.dataset.searchShowSubResults !== 'false'

  function openSearch() {
    modal!.showModal()

    if (!initialized && typeof PagefindUI !== 'undefined') {
      const container = modal!.querySelector('[data-pagefind-search]')
      if (container) {
        new PagefindUI({
          element: container,
          showSubResults,
          showImages,
          resetStyles: false,
        })
        initialized = true
      }
    }

    // Focus the search input after Pagefind renders
    requestAnimationFrame(() => {
      const input = modal!.querySelector<HTMLInputElement>('.pagefind-ui__search-input')
      input?.focus()
    })
  }

  trigger.addEventListener('click', openSearch)
  closeBtn?.addEventListener('click', () => modal.close())

  // Ctrl+K / Cmd+K shortcut
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

  // Close on backdrop click (clicking outside the dialog content)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close()
    }
  })
}
