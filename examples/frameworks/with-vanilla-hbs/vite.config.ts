/**
 * Vite is the single build tool: dev middleware + production bundle both flow through here.
 * pagesmithSsg wires the Handlebars SSR entry for HTML; sharedAssetsPlugin ships core fonts/CSS deps.
 * base/outDir match how this example is hosted under /pagesmith/examples/vanilla-hbs on GitHub Pages.
 */
import { defineConfig } from "vite-plus";
import { pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/vanilla-hbs",
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: "./src/entry-server.tsx", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../../gh-pages/examples/vanilla-hbs",
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "@pagesmith/site",
    },
  },
});
