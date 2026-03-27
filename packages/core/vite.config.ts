import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: {
      index: 'src/index.ts',
      'jsx-runtime/index': 'src/jsx-runtime/index.ts',
      'markdown/index': 'src/markdown/index.ts',
      'css/index': 'src/css/index.ts',
      'schemas/index': 'src/schemas/index.ts',
      'loaders/index': 'src/loaders/index.ts',
      'diagrams/index': 'src/diagrams/index.ts',
      'assets/index': 'src/assets/index.ts',
      'runtime/index': 'src/runtime/index.ts',
      'ai/index': 'src/ai/index.ts',
      'ssg/index': 'src/ssg/index.ts',
      'vite/index': 'src/vite/index.ts',
      'create/index': 'src/create/index.ts',
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
