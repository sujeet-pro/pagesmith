import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: {
      index: 'src/index.ts',
      'ai/index': 'src/ai/index.ts',
      'schemas/index': 'src/schemas/index.ts',
      'loaders/index': 'src/loaders/index.ts',
      'diagrams/index': 'src/diagrams/index.ts',
      'assets/index': 'src/assets/index.ts',
      'runtime/index': 'src/runtime/index.ts',
      'ssg/index': 'src/ssg/index.ts',
      'cli/bin': 'cli/bin.ts',
      'cli/diagrams': 'cli/diagrams.ts',
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
