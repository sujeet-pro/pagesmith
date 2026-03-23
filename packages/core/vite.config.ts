import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: {
      index: 'src/index.ts',
      'jsx-runtime/index': 'src/jsx-runtime/index.ts',
      'markdown/index': 'src/markdown/index.ts',
      'css/index': 'src/css/index.ts',
      'schemas/index': 'src/schemas/index.ts',
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
