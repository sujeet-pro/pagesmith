const MAIN_CONTENT_SELECTOR = '#doc-main-content'

function focusMainContent(): void {
  const mainContent = document.querySelector<HTMLElement>(MAIN_CONTENT_SELECTOR)
  if (mainContent) {
    mainContent.focus()
  }
}

export function initSkipLinkFocus(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-skip-link]').forEach((link) => {
    link.addEventListener('click', () => {
      window.setTimeout(focusMainContent, 0)
    })
  })
}
