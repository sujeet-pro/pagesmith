/**
 * Code tabs runtime — progressive enhancement for tabbed code blocks.
 *
 * Activates `.ps-code-tabs` containers produced by rehype-code-tabs
 * around Pagesmith-owned code block wrappers:
 * - Adds `.ps-code-tabs-ready` class (enables the tab strip and single-panel view)
 * - Click handler: switches active tab and panel
 * - Keyboard: Left/Right arrows, Home/End for first/last tab
 * - Keeps the active tab scrolled into view inside horizontal overflow
 *
 * Uses event delegation on `document` so it works with dynamically
 * injected content (e.g. SPA page transitions).
 */

type SwitchOptions = {
  focus?: boolean
  scroll?: boolean
  smooth?: boolean
}

const CODE_TABS_RUNTIME_KEY = '__pagesmithCodeTabsRuntime'

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
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  function activate(container: Element): void {
    const selected = getSelectedTab(container)
    if (!selected) return
    switchTab(container, selected, { scroll: false, smooth: false })
    container.classList.add('ps-code-tabs-ready')
  }

  document.querySelectorAll('.ps-code-tabs').forEach(activate)

  const runtimeState = window as Window & { [CODE_TABS_RUNTIME_KEY]?: boolean }
  if (runtimeState[CODE_TABS_RUNTIME_KEY]) return
  runtimeState[CODE_TABS_RUNTIME_KEY] = true

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
  observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true })
}
