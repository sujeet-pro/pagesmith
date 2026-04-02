/**
 * Runtime entry point — browser only.
 *
 * All features are progressive enhancements on top of CSS-only behavior.
 * The site works without JS — this adds TOC highlighting
 * and sidebar scroll-to-current.
 */

import { initSidebar } from './sidebar'
import { initTocHighlight } from './toc-highlight'

initSidebar()
initTocHighlight()
