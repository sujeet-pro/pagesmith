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
      "ai/index": "src/ai/index.ts",
      "vite/index": "src/vite/index.ts",
      "create/index": "src/create/index.ts",
      "cli-kit/index": "src/cli-kit/index.ts",
      "cli/bin": "src/cli/bin.ts",
      "cli/skills-install": "src/cli/skills-install.ts",
      "mcp/index": "src/mcp/index.ts",
      "mcp/server": "src/mcp/server.ts",
      "log/index": "src/log/index.ts",
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
