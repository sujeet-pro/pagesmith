import { defineConfig } from 'vite-plus'

/**
 * Rolldown plugin that fixes postcss/lightningcss .d.ts/.d.mts files where
 * type-only imports/exports lack the `type` modifier, causing MISSING_EXPORT
 * warnings from the DTS bundler.
 *
 * Handles two patterns:
 * 1. `import Default, { Named }` → `import type { default as Default, Named }`
 * 2. `export { Named } from '...'` → `export type { Named } from '...'`
 */
function fixPostcssDtsImports() {
  const DTS_RE = /node_modules\/(postcss|lightningcss|vite)\/.*\.d\.(ts|mts|cts)$/
  return {
    name: 'pagesmith:fix-postcss-dts-imports',
    transform: {
      filter: { id: { include: [DTS_RE] } },
      handler(code: string, id: string) {
        let result = code
        // Convert `import DefaultExport, { Named1, Named2 } from '...'`
        // into `import type { default as DefaultExport, Named1, Named2 } from '...'`
        result = result.replace(
          /^import\s+(\w+)\s*,\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])/gm,
          (_, defaultName, named, source) =>
            `import type { default as ${defaultName}, ${named} } from ${source}`,
        )
        // Convert `export { Named1, Named2 } from '...'`
        // into `export type { Named1, Named2 } from '...'`
        // (only for postcss/lightningcss .d.mts re-exports)
        if (/node_modules\/(postcss|lightningcss)\//.test(id)) {
          result = result.replace(
            /^(export\s+)(?!type\s)(\{[^}]+\}\s*from\s*['"][^'"]+['"])/gm,
            '$1type $2',
          )
        }
        // For vite .d.ts: add type modifier to imports from postcss/lightningcss
        if (/node_modules\/vite\//.test(id)) {
          result = result.replace(
            /^(import\s+)(?!type\s)(.+from\s+['"](?:postcss|lightningcss)['"])/gm,
            'import type $2',
          )
        }
        return result
      },
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
    },
  },
  pack: {
    entry: {
      index: 'src/index.ts',
      'jsx-runtime/index': 'src/jsx-runtime/index.ts',
      'markdown/index': 'src/markdown/index.ts',
      'css/index': 'src/css/index.ts',
      'schemas/index': 'src/schemas/index.ts',
      'loaders/index': 'src/loaders/index.ts',
      'assets/index': 'src/assets/index.ts',
      'runtime/index': 'src/runtime/index.ts',
      'runtime/content': 'src/runtime/content.ts',
      'runtime/standalone': 'src/runtime/standalone.ts',
      'runtime/code-blocks': 'src/runtime/code-blocks.ts',
      'runtime/code-tabs': 'src/runtime/code-tabs.ts',
      'runtime/toc-highlight': 'src/runtime/toc-highlight.ts',
      'ai/index': 'src/ai/index.ts',
      'vite/index': 'src/vite/index.ts',
      'ssg-utils/index': 'src/ssg-utils/index.ts',
      'create/index': 'src/create/index.ts',
      'mcp/index': 'src/mcp/index.ts',
      'mcp/server': 'src/mcp/server.ts',
    },
    plugins: [fixPostcssDtsImports()],
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
