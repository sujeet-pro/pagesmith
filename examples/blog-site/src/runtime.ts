/**
 * Browser-only enhancements after SSG emitted fully readable HTML.
 *
 * The shared Pagesmith site runtime now owns theme persistence,
 * TOC highlighting, search-trigger density, and the mobile sidebar
 * modal. Keep only the blog example's sidebar auto-scroll here.
 */

import '@pagesmith/site/runtime/standalone'

{
  const active = document.querySelector('.doc-sidebar-item.active .doc-sidebar-link')
  if (active instanceof HTMLElement) {
    active.scrollIntoView({ block: 'center' })
  }
}
