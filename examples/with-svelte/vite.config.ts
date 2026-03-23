import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite-plus'
import contentPlugin from './vite-plugin-content'

export default defineConfig({
  base: process.env.BASE_URL ?? '/',
  plugins: [svelte(), contentPlugin()],
})
