import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { pathToFileURL } from 'url'
import { build } from 'vite'
import { createContentLayer } from '@pagesmith/core'
import { pages, posts } from '../shared-content/content.config.ts'

const root = import.meta.dirname
const absOutDir = resolve(root, '../../gh-pages/examples/react')
const serverDir = resolve(absOutDir, '.server')
const contentRoot = resolve(root, '../shared-content')

// ── Discover routes from content ──

const layer = createContentLayer({
  collections: { posts, pages },
  root: contentRoot,
})

const allPosts = await layer.getCollection('posts')
const routes = ['/', '/about', ...allPosts.map((p) => `/posts/${p.slug}`)]

// ── Client build ──

console.log('Building client bundle...')
await build({
  root,
  logLevel: 'warn',
})

// ── SSR build ──

console.log('Building SSR bundle...')
await build({
  root,
  build: {
    ssr: resolve(root, 'src/entry-server.tsx'),
    outDir: serverDir,
    emptyOutDir: true,
  },
  logLevel: 'warn',
})

// ── Pre-render routes ──

const ssrModulePath = resolve(serverDir, 'entry-server.js')
if (!existsSync(ssrModulePath)) {
  throw new Error(`SSR build output not found at ${ssrModulePath}`)
}

const { render } = await import(pathToFileURL(ssrModulePath).href)
const template = readFileSync(resolve(absOutDir, 'index.html'), 'utf-8')

console.log(`Pre-rendering ${routes.length} routes...`)

for (const route of routes) {
  const html = template.replace('<!--ssr-outlet-->', await render(route))
  const routePath = route === '/' ? '' : route.replace(/^\//, '')
  const outPath = resolve(absOutDir, routePath, 'index.html')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
}

// ── Cleanup ──

rmSync(serverDir, { recursive: true, force: true })
console.log(`Done — ${routes.length} pages generated.`)
