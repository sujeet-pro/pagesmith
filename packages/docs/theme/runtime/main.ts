/**
 * Runtime entry point — browser only.
 *
 * All features are progressive enhancements on top of CSS-only behavior.
 * The site works without JS — this adds TOC highlighting,
 * sidebar toggle behavior, search, and the shared Pagesmith code runtime.
 */

import '@pagesmith/site/runtime/content'
import { initTheme } from '@pagesmith/site/runtime/theme'
import { initTocHighlight } from '@pagesmith/site/runtime/toc-highlight'
import { initFooterCopyrightYear } from './copyright'
import { initSearch } from './search'
import { initSidebar } from './sidebar'

initFooterCopyrightYear()
initTheme()
initSidebar()
initTocHighlight()
initSearch()
