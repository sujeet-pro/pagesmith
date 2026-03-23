import { defineConfig } from 'vite-plus'
import solidPlugin from 'vite-plugin-solid'
import contentPlugin from './vite-plugin-content'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [contentPlugin(), solidPlugin()],
})
