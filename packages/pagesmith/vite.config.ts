import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: {
      index: 'src/index.ts',
      'jsx-runtime/index': 'src/jsx-runtime/index.ts',
      'schemas/index': 'schemas/index.ts',
      'build/worker': 'src/build/worker.ts',
    },
    format: 'esm',
    dts: true,
    sourcemap: true,
    clean: true,
    platform: 'node',
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
