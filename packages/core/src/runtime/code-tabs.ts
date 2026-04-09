/**
 * Code tabs runtime — progressive enhancement for tabbed code blocks.
 *
 * Activates `.ps-code-tabs` containers produced by rehype-code-tabs:
 * - Adds `.ps-code-tabs-active` class (enables CSS tab nav, hides EC titles)
 * - Click handler: switches active tab and panel
 * - Keyboard: Left/Right arrows, Home/End for first/last tab
 *
 * Uses event delegation on `document` so it works with dynamically
 * injected content (e.g. SPA page transitions).
 */

export function initCodeTabs(): void {
  function activate(container: Element): void {
    container.classList.add('ps-code-tabs-active')
  }

  document.querySelectorAll('.ps-code-tabs').forEach(activate)

  function switchTab(container: Element, tab: Element): void {
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]')
    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]')

    tabs.forEach((t) => {
      const isTarget = t === tab
      t.setAttribute('aria-selected', String(isTarget))
      t.tabIndex = isTarget ? 0 : -1
    })

    panels.forEach((p) => {
      const tabId = p.getAttribute('aria-labelledby') || ''
      p.hidden = tabId !== tab.id
    })
  }

  document.addEventListener('click', (e) => {
    const tab = (e.target as Element).closest?.('.ps-code-tabs [role="tab"]')
    if (!tab) return
    const container = tab.closest('.ps-code-tabs')
    if (!container) return
    switchTab(container, tab)
  })

  document.addEventListener('keydown', (e) => {
    const tab = (e.target as Element).closest?.('.ps-code-tabs [role="tab"]')
    if (!tab) return
    const container = tab.closest('.ps-code-tabs')
    if (!container) return

    const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))
    const idx = tabs.indexOf(tab as HTMLElement)
    if (idx < 0) return

    let next: HTMLElement | undefined
    switch (e.key) {
      case 'ArrowLeft':
        next = tabs[idx > 0 ? idx - 1 : tabs.length - 1]
        break
      case 'ArrowRight':
        next = tabs[idx < tabs.length - 1 ? idx + 1 : 0]
        break
      case 'Home':
        next = tabs[0]
        break
      case 'End':
        next = tabs[tabs.length - 1]
        break
      default:
        return
    }

    if (next) {
      e.preventDefault()
      next.focus()
      switchTab(container, next)
    }
  })

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof Element) {
          if (node.matches('.ps-code-tabs')) activate(node)
          node.querySelectorAll('.ps-code-tabs').forEach(activate)
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
