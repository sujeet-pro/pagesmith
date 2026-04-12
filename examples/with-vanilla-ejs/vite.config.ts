import { defineConfig } from 'vite-plus'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

// Vite is the single build runner: client assets + post-build SSG from
// `src/entry-server.tsx`. `sharedAssetsPlugin` copies core font/CSS assets;
// `pagesmithSsg` adds dev SSR middleware and, on `vite build`, renders routes
// then runs Pagefind (see `SsgRenderConfig.searchEnabled` in the SSR entry).

export default defineConfig({
  base: '/pagesmith/examples/vanilla-ejs',
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/vanilla-ejs',
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: '@pagesmith/core',
    },
  },
})
