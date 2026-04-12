/**
 * Runtime entry point — browser only.
 *
 * All features are progressive enhancements on top of CSS-only behavior.
 * The site works without JS — this adds TOC highlighting,
 * sidebar toggle behavior, search, and the shared Pagesmith code runtime.
 */

import '@pagesmith/core/runtime/content'
import { initFooterCopyrightYear } from './copyright'
import { initSearch } from './search'
import { initSidebar } from './sidebar'
import { initTheme } from './theme'
import { initTocHighlight } from './toc-highlight'

initFooterCopyrightYear()
initTheme()
initSidebar()
initTocHighlight()
initSearch()
