/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * TOC highlighting. Code block interactivity (copy, etc.)
 * is handled by Expressive Code through inline scripts.
 */

import { initTocHighlight } from './toc-highlight'

initTocHighlight()
