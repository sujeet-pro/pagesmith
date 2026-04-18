import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    alias: {
      "vite-plus/test": "vitest",
    },
    projects: ["packages/core", "packages/site", "packages/docs", "tests/integration"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "packages/core/src/config.ts",
        "packages/core/src/content-layer.ts",
        "packages/core/src/convert.ts",
        "packages/core/src/entry.ts",
        "packages/core/src/frontmatter.ts",
        "packages/core/src/store.ts",
        "packages/core/src/toc.ts",
        "packages/core/src/loaders/index.ts",
        "packages/core/src/markdown/pipeline.ts",
        "packages/core/src/utils/*.ts",
        "packages/core/src/validation/*.ts",
        "packages/core/src/ai/content-*.ts",
        "packages/site/src/config.ts",
        "packages/site/src/cli/*.ts",
        "packages/site/src/css/builder.ts",
        "packages/site/src/jsx-runtime/index.ts",
        "packages/site/src/runtime/index.ts",
        "packages/docs/src/content.ts",
        "packages/docs/src/navigation.ts",
        "packages/docs/src/config/shared.ts",
        "packages/docs/src/config/validate.ts",
      ],
      exclude: ["**/*.d.ts", "**/node_modules/**", "**/*.test.ts", "**/__tests__/**"],
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 75,
        functions: 85,
      },
    },
  },
  // ── Lint + Format ──
  // We intentionally do NOT inline `lint`/`fmt` blocks here. vite-plus
  // (≤ 0.1.18) currently passes `vite.config.ts` directly to oxlint/oxfmt
  // via `-c`, and they do not understand the surrounding Vite/Vitest
  // top-level fields (e.g. `test:`), which makes `vp lint` / `vp check`
  // crash with `unknown field 'test'`. While the upstream issue is open,
  // we keep the canonical lint/fmt config in `.oxlintrc.json` and
  // `.oxfmtrc.json` and let vite-plus discover them. See:
  //   https://github.com/voidzero-dev/vite-plus/issues/930
  //   https://github.com/voidzero-dev/vite-plus/issues/1084
  staged: {
    "*": "vp check --fix",
  },
});
