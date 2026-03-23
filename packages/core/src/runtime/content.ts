/**
 * Content-specific runtime entry point — browser only.
 *
 * Minimal enhancements for rendered markdown output:
 * only copy-to-clipboard for code blocks.
 * Does NOT include theme persistence or TOC highlighting,
 * which are site-level concerns handled by standalone.ts.
 */

import { initCopyCode } from './copy-code'

initCopyCode()
