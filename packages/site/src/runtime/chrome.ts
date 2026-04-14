/**
 * Shared site chrome runtime entry point — browser only.
 *
 * Progressive enhancements for reusable Pagesmith site components:
 * theme persistence, TOC highlighting, skip-link focus, mobile
 * sidebar modal behavior, search-trigger density, and footer year.
 */

import { initFooterCopyrightYear } from './footer-year'
import { initSearchTriggerDensity } from './search-trigger'
import { initSidebarModal } from './sidebar'
import { initSkipLinkFocus } from './skip-link'
import { initTheme } from './theme'
import { initTocHighlight } from './toc-highlight'

export { initFooterCopyrightYear } from './footer-year'
export { initSearchTriggerDensity } from './search-trigger'
export { initSidebarModal } from './sidebar'
export { initSkipLinkFocus } from './skip-link'
export { initTheme } from './theme'
export { initTocHighlight } from './toc-highlight'

initFooterCopyrightYear()
initSearchTriggerDensity()
initSidebarModal()
initSkipLinkFocus()
initTheme()
initTocHighlight()
