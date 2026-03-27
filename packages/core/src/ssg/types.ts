/**
 * Shared types for the SSG dev and preview servers.
 */

/** Message sent from the browser client to the dev server. */
export type ClientMessage = { type: 'page'; path: string }

/** Message sent from the dev server to connected browser clients. */
export type ServerMessage = { type: 'reload' } | { type: 'css-update' }

/** Options for the dev server. */
export interface DevServerOptions {
  /** Output directory where built files are served from. */
  outDir: string
  /** Content source directory — used for targeted page-aware rebuilds. */
  contentDir: string
  /** Directories to watch for changes (content, layouts, styles, etc.). */
  watchDirs: string[]
  /** Optional regex pattern matching diagram file extensions to watch separately. */
  diagramExtPattern?: RegExp
  /** Port to listen on (default: 3000). */
  port?: number
  /** Open the browser after the server starts (default: false). */
  open?: boolean
  /** Called for the initial build and on every content/layout/style change. */
  buildFn: () => Promise<void>
  /** Optional callback for diagram file changes. When omitted, diagram files are ignored. */
  diagramFn?: (opts: { file?: string }) => Promise<void>
}

/** Options for the preview server. */
export interface PreviewOptions {
  /** Output directory to serve (default: `dist/` in cwd). */
  outDir?: string
  /** Port to listen on (default: 4000 or $PORT). */
  port?: number
}
