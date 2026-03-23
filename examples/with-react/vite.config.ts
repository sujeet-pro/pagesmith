import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'
import { contentPlugin } from './vite-plugin-content'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [contentPlugin(), react()],
})
