/**
 * Runtime entry point — browser only.
 *
 * All features are progressive enhancements on top of CSS-only behavior.
 * The site works without JS — this adds TOC highlighting,
 * sidebar toggle behavior, and search. Code block interactivity
 * (copy button, etc.) is handled by Expressive Code inline scripts.
 */

import { initSearch } from './search'
import { initSidebar } from './sidebar'
import { initTocHighlight } from './toc-highlight'

initSidebar()
initTocHighlight()
initSearch()
