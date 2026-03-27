/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * TOC highlighting and copy-to-clipboard.
 */

import { initCopyCode } from './copy-code'
import { initTocHighlight } from './toc-highlight'

initTocHighlight()
initCopyCode()
