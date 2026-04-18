/**
 * Standalone runtime entry point — browser only.
 *
 * Progressive enhancements for the standalone layout:
 * reusable site chrome plus the full content runtime.
 */

import "./chrome";
import { initCodeBlocks } from "./code-blocks";
import { initCodeTabs } from "./code-tabs";

export * from "./chrome";
export { initCodeBlocks } from "./code-blocks";
export { initCodeTabs } from "./code-tabs";

initCodeBlocks();
initCodeTabs();
