import { defineConfig } from "vite-plus";

function fixPostcssDtsImports() {
  const DTS_RE = /node_modules\/(postcss|lightningcss|vite)\/.*\.d\.(ts|mts|cts)$/;
  return {
    name: "pagesmith:fix-postcss-dts-imports",
    transform: {
      filter: { id: { include: [DTS_RE] } },
      handler(code: string, id: string) {
        let result = code;
        result = result.replace(
          /^import\s+(\w+)\s*,\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])/gm,
          (_, defaultName, named, source) =>
            `import type { default as ${defaultName}, ${named} } from ${source}`,
        );
        if (/node_modules\/(postcss|lightningcss)\//.test(id)) {
          result = result.replace(
            /^(export\s+)(?!type\s)(\{[^}]+\}\s*from\s*['"][^'"]+['"])/gm,
            "$1type $2",
          );
        }
        if (/node_modules\/vite\//.test(id)) {
          result = result.replace(
            /^(import\s+)(?!type\s)(.+from\s+['"](?:postcss|lightningcss)['"])/gm,
            "import type $2",
          );
        }
        return result;
      },
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "vite-plus/test": "vitest",
    },
  },
  pack: {
    entry: {
      index: "src/index.ts",
      "markdown/index": "src/markdown/index.ts",
      "schemas/index": "src/schemas/index.ts",
      "loaders/index": "src/loaders/index.ts",
      "assets/index": "src/assets/index.ts",
      config: "src/config.ts",
      preset: "src/preset.ts",
      "jsx-runtime/index": "src/jsx-runtime/index.ts",
      "jsx-dev-runtime/index": "src/jsx-dev-runtime/index.ts",
      "components/index": "src/components/index.ts",
      "layouts/index": "src/layouts/index.ts",
      "theme/index": "src/theme/index.ts",
      "css/index": "src/css/index.ts",
      "runtime/index": "src/runtime/index.ts",
      "runtime/chrome": "src/runtime/chrome.ts",
      "runtime/content": "src/runtime/content.ts",
      "runtime/standalone": "src/runtime/standalone.ts",
      "runtime/code-blocks": "src/runtime/code-blocks.ts",
      "runtime/code-tabs": "src/runtime/code-tabs.ts",
      "runtime/footer-year": "src/runtime/footer-year.ts",
      "runtime/search-trigger": "src/runtime/search-trigger.ts",
      "runtime/sidebar": "src/runtime/sidebar.ts",
      "runtime/skip-link": "src/runtime/skip-link.ts",
      "runtime/toc-highlight": "src/runtime/toc-highlight.ts",
      "runtime/theme": "src/runtime/theme.ts",
      "vite/index": "src/vite/index.ts",
      "ssg-utils/index": "src/ssg-utils/index.ts",
      "build-validator": "src/build-validator.ts",
      "cli/bin": "src/cli/bin.ts",
    },
    plugins: [fixPostcssDtsImports()],
    deps: {
      onlyBundle: false,
    },
    format: "esm",
    dts: true,
    sourcemap: true,
    clean: true,
    platform: "node",
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
