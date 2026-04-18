import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import collections from "./content.config";
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/svelte",
  plugins: [
    sharedAssetsPlugin(),
    svelte(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: "./src/entry-server.ts", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../../gh-pages/examples/svelte",
    emptyOutDir: true,
    rolldownOptions: { checks: { pluginTimings: false } },
  },
});
