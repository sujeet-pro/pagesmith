import { resolve } from 'path'
import content from '../shared-content/content.config'
import { pagesmithContent } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  base: '/pagesmith/examples/solid/',
  build: {
    outDir: '../../gh-pages/examples/solid',
  },
  plugins: [
    pagesmithContent({
      collections: {
        posts: content.posts,
        authors: content.authors,
        pages: content.pages,
      },
      root: resolve(import.meta.dirname, '../shared-content'),
      configPath: '../shared-content/content.config.ts',
      dts: 'src/pagesmith-content.d.ts',
    }),
    solidPlugin({
      solid: { generate: process.env.SOLID_SSR ? 'ssr' : 'dom' },
    }),
  ],
})
