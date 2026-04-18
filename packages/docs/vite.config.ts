import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "vite-plus/test": "vitest",
    },
  },
  pack: {
    entry: {
      index: "src/index.ts",
      theme: "src/theme.ts",
      "components/index": "src/components/index.ts",
      "layouts/index": "src/layouts/index.ts",
      "jsx-runtime/index": "src/jsx-runtime/index.ts",
      "jsx-dev-runtime/index": "src/jsx-dev-runtime/index.ts",
      "cli/bin": "src/cli/bin.ts",
      "mcp/server": "src/mcp/server.ts",
      preset: "src/preset.ts",
      "schemas/index": "src/schemas/index.ts",
      "build-validator": "src/build-validator.ts",
    },
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
