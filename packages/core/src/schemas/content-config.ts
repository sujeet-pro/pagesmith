/**
 * Content layer configuration schema.
 */

import type { MarkdownConfig } from "./markdown-config";
import type { CollectionMap } from "./collection";

/** Content layer configuration — passed to defineConfig() or createContentLayer(). */
export type ContentLayerConfig = {
  /** Named collections keyed by collection name. */
  collections: CollectionMap;
  /** Root directory for resolving relative collection paths (defaults to cwd()). */
  root?: string;
  /** Markdown processing config shared across all collections (themes, plugins, options). */
  markdown?: MarkdownConfig;
  /** Asset hashing config for cache-busted filenames. */
  assets?: {
    /** Enable content-hash filenames (e.g. `style.a1b2c3.css`). */
    hashFilenames?: boolean;
    /** Output directory for hashed assets. */
    outputDir?: string;
  };
  /** Content plugins for extending processing and validation. */
  plugins?: ContentPlugin[];
  /**
   * When true, throw on file load errors instead of creating dummy entries.
   * When false (default), log a warning and continue with empty data.
   */
  strict?: boolean;
};

/** Plugin interface for extending the content pipeline with custom processing and validation. */
export type ContentPlugin = {
  /** Unique plugin name (used in error reporting and diagnostics). */
  name: string;
  /**
   * Rehype plugin factory for HTML AST transformation.
   * Called once during pipeline setup; the returned function runs on each entry's HAST tree.
   */
  rehypePlugin?: () => (tree: any) => void;
  /**
   * Remark plugin factory for markdown AST transformation.
   * Called once during pipeline setup; the returned function runs on each entry's MDAST tree.
   */
  remarkPlugin?: () => (tree: any) => void;
  /**
   * Validate plugin-specific metadata on each entry.
   * Returns an array of error message strings (empty array = valid).
   * Runs after schema validation and content validation.
   */
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[];
};
