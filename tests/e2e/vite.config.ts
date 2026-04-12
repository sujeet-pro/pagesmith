import { resolve } from 'path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
      '@pagesmith/core': resolve(import.meta.dirname, '../../packages/core/src/index.ts'),
      '@pagesmith/core/runtime': resolve(
        import.meta.dirname,
        '../../packages/core/src/runtime/index.ts',
      ),
      '@pagesmith/core/markdown': resolve(
        import.meta.dirname,
        '../../packages/core/src/markdown/index.ts',
      ),
      '@pagesmith/core/loaders': resolve(
        import.meta.dirname,
        '../../packages/core/src/loaders/index.ts',
      ),
      '@pagesmith/core/schemas': resolve(
        import.meta.dirname,
        '../../packages/core/src/schemas/index.ts',
      ),
    },
  },
  test: {
    include: ['*.test.ts'],
    testTimeout: 30_000,
  },
})
