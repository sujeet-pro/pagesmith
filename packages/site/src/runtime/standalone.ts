/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * TOC highlighting plus the full content runtime.
 */

import { initCodeBlocks } from './code-blocks'
import { initCodeTabs } from './code-tabs'
import { initTheme } from './theme'
import { initTocHighlight } from './toc-highlight'

export { initCodeBlocks } from './code-blocks'
export { initCodeTabs } from './code-tabs'
export { initTheme } from './theme'
export { initTocHighlight } from './toc-highlight'

initCodeBlocks()
initTheme()
initTocHighlight()
initCodeTabs()
