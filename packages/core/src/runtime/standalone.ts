/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * TOC highlighting, code tab switching. Code block interactivity
 * (copy, etc.) is handled by Expressive Code through inline scripts.
 */

import { initCodeTabs } from './code-tabs'
import { initTocHighlight } from './toc-highlight'

initTocHighlight()
initCodeTabs()
