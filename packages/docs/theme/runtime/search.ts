/**
 * Search trigger enhancement.
 *
 * Pagefind Component UI handles search behavior natively, but we
 * switch the header trigger into Pagefind's compact icon-only mode
 * on small screens so the shortcut badge doesn't crowd the header.
 */

const MOBILE_TRIGGER_MEDIA_QUERY = '(max-width: 640px)'

function syncTriggerMode(isCompact: boolean): void {
  document
    .querySelectorAll<HTMLElement>('pagefind-modal-trigger.doc-search-trigger')
    .forEach((trigger) => {
      if (isCompact) {
        trigger.setAttribute('compact', '')
        trigger.setAttribute('hide-shortcut', '')
      } else {
        trigger.removeAttribute('compact')
        trigger.removeAttribute('hide-shortcut')
      }
    })
}

export function initSearch(): void {
  if (typeof window.matchMedia !== 'function') return

  const mediaQuery = window.matchMedia(MOBILE_TRIGGER_MEDIA_QUERY)
  const sync = () => syncTriggerMode(mediaQuery.matches)

  sync()

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', sync)
  } else {
    mediaQuery.addListener(sync)
  }
}
