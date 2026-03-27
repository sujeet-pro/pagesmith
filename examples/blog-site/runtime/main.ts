/**
 * Runtime entry point — browser only.
 *
 * All features are progressive enhancements on top of CSS-only behavior.
 * The site works without JS — this adds TOC highlighting,
 * sidebar scroll-to-current, and copy-to-clipboard.
 */

import { initCopyCode } from './copy-code'
import { initSidebar } from './sidebar'
import { initTocHighlight } from './toc-highlight'

initSidebar()
initTocHighlight()
initCopyCode()
