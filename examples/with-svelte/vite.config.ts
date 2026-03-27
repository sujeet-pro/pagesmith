import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import content from '../shared-content/content.config'
import { pagesmithContent } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  base: '/pagesmith/examples/svelte/',
  build: {
    outDir: '../../gh-pages/examples/svelte',
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
    svelte(),
  ],
})
