/**
 * Content runtime entry point — browser only.
 *
 * Progressive enhancements for Pagesmith-rendered markdown:
 * code tabs, copy buttons, and collapsed code ranges.
 */

import { initCodeBlocks } from './code-blocks'
import { initCodeTabs } from './code-tabs'

export { initCodeBlocks } from './code-blocks'
export { initCodeTabs } from './code-tabs'

initCodeBlocks()
initCodeTabs()
