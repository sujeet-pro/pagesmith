/**
 * Browser entry only: no Handlebars, no createContentLayer.
 * Theme CSS plus core runtime hooks progressive enhancements onto SSR-generated HTML.
 * The block below tweaks Pagefind trigger chrome at small widths (optional UX polish).
 */
import './src/theme.css'
import '@pagesmith/site/runtime/content'

if (typeof window.matchMedia === 'function') {
  const mediaQuery = window.matchMedia('(max-width: 640px)')
  const sync = () => {
    document.querySelectorAll('pagefind-modal-trigger.doc-search-trigger').forEach((trigger) => {
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
