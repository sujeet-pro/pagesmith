/**
 * Code tabs runtime for the docs theme.
 *
 * Kept local to the docs package so the packaged theme runtime can be
 * bundled without depending on workspace-only source resolution.
 * Activates tab groups around Pagesmith-owned code block wrappers.
 */

type SwitchOptions = {
  focus?: boolean
  scroll?: boolean
  smooth?: boolean
}

function getTabs(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.ps-code-tabs-nav [role="tab"]'))
}

function getPanels(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.ps-code-tab-panel'))
}

function getSelectedTab(container: Element): HTMLElement | undefined {
  return (
    getTabs(container).find((tab) => tab.getAttribute('aria-selected') === 'true') ??
    getTabs(container)[0]
  )
}

function scrollTabIntoView(tab: HTMLElement, smooth: boolean): void {
  tab.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function switchTab(container: Element, tab: HTMLElement, options: SwitchOptions = {}): void {
  const tabs = getTabs(container)
  const panels = getPanels(container)

  tabs.forEach((candidate) => {
    const isTarget = candidate === tab
    candidate.setAttribute('aria-selected', String(isTarget))
    candidate.tabIndex = isTarget ? 0 : -1
  })

  panels.forEach((panel) => {
    const tabId = panel.getAttribute('aria-labelledby') || ''
    panel.hidden = tabId !== tab.id
  })

  if (options.focus) tab.focus()
  if (options.scroll !== false) scrollTabIntoView(tab, options.smooth === true)
}

export function initCodeTabs(): void {
  function activate(container: Element): void {
    const selected = getSelectedTab(container)
    if (!selected) return
    switchTab(container, selected, { scroll: false, smooth: false })
    container.classList.add('ps-code-tabs-ready')
  }

  document.querySelectorAll('.ps-code-tabs').forEach(activate)

  document.addEventListener('click', (e) => {
    const tab = (e.target as Element).closest?.('.ps-code-tabs [role="tab"]') as HTMLElement | null
    if (!tab) return
    const container = tab.closest('.ps-code-tabs')
    if (!container) return
    switchTab(container, tab, { smooth: true })
  })

  document.addEventListener('keydown', (e) => {
    const tab = (e.target as Element).closest?.('.ps-code-tabs [role="tab"]') as HTMLElement | null
    if (!tab) return
    const container = tab.closest('.ps-code-tabs')
    if (!container) return

    const tabs = getTabs(container)
    const idx = tabs.indexOf(tab)
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
      switchTab(container, next, { focus: true, smooth: true })
    }
  })

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          if (node.matches('.ps-code-tabs')) activate(node)
          node.querySelectorAll('.ps-code-tabs').forEach(activate)
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
