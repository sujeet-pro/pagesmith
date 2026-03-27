import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import content from '../shared-content/content.config'
import { pagesmithContent } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  base: '/pagesmith/examples/react/',
  build: {
    outDir: '../../gh-pages/examples/react',
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
    react(),
  ],
})
