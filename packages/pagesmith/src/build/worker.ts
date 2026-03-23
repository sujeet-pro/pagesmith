/**
 * Worker entry point for parallel page rendering.
 *
 * Runs inside a node:worker_threads Worker. Receives serialized page tasks
 * and global index data via postMessage, renders the page, and posts back
 * the result.
 *
 * Each worker gets its own layout cache (module-level in layout-loader.ts)
 * and its own dynamic imports, so there are no shared-state concerns.
 */

import { parentPort } from 'worker_threads'

parentPort!.on('message', async (data) => {
  const { type, task, globalIndex, outDir, layoutsDir } = data

  if (type === 'render') {
    try {
      const { renderPageFromWorker } = await import('./renderer')
      await renderPageFromWorker(task, globalIndex, outDir, layoutsDir)
      parentPort!.postMessage({ type: 'done', slug: task.slug })
    } catch (error) {
      parentPort!.postMessage({
        type: 'error',
        slug: task.slug,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
})
