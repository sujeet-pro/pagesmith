import { defineConfig } from 'vite-plus'
import collections from './content.config'
import solid from 'vite-plugin-solid'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'

// Vite drives everything: Solid compiles the SSR entry as server components, Pagesmith
// wires markdown collections into virtual modules the entry imports, and `pagesmithSsg`
// adds dev SSR middleware plus the production static pass (HTML per route + Pagefind).
export default defineConfig({
  base: '/pagesmith/examples/solid',
  plugins: [
    sharedAssetsPlugin(),
    solid({ ssr: true }),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: '../../gh-pages/examples/solid',
    emptyOutDir: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
})
