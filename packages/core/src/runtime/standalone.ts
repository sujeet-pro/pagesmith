/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * theme persistence, TOC highlighting, and copy-to-clipboard.
 */

import { initCopyCode } from './copy-code'
import { initTheme } from './theme'
import { initTocHighlight } from './toc-highlight'

initTheme()
initTocHighlight()
initCopyCode()
