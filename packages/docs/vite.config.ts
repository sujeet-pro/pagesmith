import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
    },
  },
  pack: {
    entry: {
      index: 'src/index.ts',
      theme: 'src/theme.ts',
      'cli/bin': 'src/cli/bin.ts',
      'mcp/server': 'src/mcp/server.ts',
      preset: 'src/preset.ts',
      'schemas/index': 'src/schemas/index.ts',
    },
    deps: {
      onlyBundle: false,
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
