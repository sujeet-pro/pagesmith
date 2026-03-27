import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: {
      index: 'src/index.ts',
      preset: 'src/preset.ts',
      'schemas/index': 'src/schemas/index.ts',
    },
    deps: {
      alwaysBundle: ['@pagesmith/core'],
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
