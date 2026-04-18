// Site-only example: no pagesmithContent — the SSR entry calls createContentLayer directly.
// pagesmithSsg still needs contentDirs so companion assets under content/ copy to /assets/.
import { defineConfig } from "vite-plus";
import { pagesmithSsg, sharedAssetsPlugin } from "@pagesmith/site/vite";

export default defineConfig({
  base: "/pagesmith/examples/blog-site",
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: "./src/entry-server.tsx", contentDirs: ["./content"] }),
  ],
  build: {
    outDir: "../../gh-pages/examples/blog-site",
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
