import { join } from 'path'
import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { createContentLayer } from '../content-layer'
import { defineCollection, defineConfig } from '../config'

describe('ContentLayer.watch', () => {
  it('returns a WatchHandle with close method', () => {
    const config = defineConfig({
      root: join(import.meta.dirname, 'fixtures'),
      collections: {
        posts: defineCollection({
          loader: 'markdown',
          directory: 'content',
          schema: z.object({
            title: z.string(),
          }),
        }),
      },
    })
    const layer = createContentLayer(config)
    const handle = layer.watch(() => {})
    expect(handle).toBeDefined()
    expect(typeof handle.close).toBe('function')
    handle.close()
  })
})
