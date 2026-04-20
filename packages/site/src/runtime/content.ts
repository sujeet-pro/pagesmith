/**
 * Content runtime entry point — browser only.
 *
 * Progressive enhancements for Pagesmith-rendered markdown:
 * code tabs, copy buttons, collapsed code ranges, and themed images.
 */

import { initCodeBlocks } from "./code-blocks";
import { initCodeTabs } from "./code-tabs";
import { initImageZoom } from "./image-zoom";
import { initThemedImages } from "./themed-images";

export { initCodeBlocks } from "./code-blocks";
export { initCodeTabs } from "./code-tabs";
export { initImageZoom } from "./image-zoom";
export { initThemedImages } from "./themed-images";

initCodeBlocks();
initCodeTabs();
initThemedImages();
initImageZoom();
