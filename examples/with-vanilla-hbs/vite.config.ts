import { defineConfig } from 'vite-plus'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/pagesmith/examples/vanilla-hbs/',
  plugins: [
    sharedAssetsPlugin(),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/vanilla-hbs',
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
