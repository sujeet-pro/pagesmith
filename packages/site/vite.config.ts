import { defineConfig } from "vite-plus";
import { fixPostcssDtsImports } from "../../scripts/vite/fix-postcss-dts-imports.ts";

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
      "runtime/image-zoom": "src/runtime/image-zoom.ts",
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
