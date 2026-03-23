/**
 * Minimal SSG build script.
 *
 * Demonstrates the simplest possible static site generator using
 * @pagesmith/content — pure string templates, no template engine,
 * no client JS except copy-code, OS-driven dark/light mode.
 */

import { createContentLayer, defineConfig } from '@pagesmith/content'
import { getContentCSS, getContentJS } from '@pagesmith/content/runtime'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { pages, posts } from '../shared-content/content.config.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, 'dist')

// ── Content layer ──

const layer = createContentLayer(
  defineConfig({
    root: resolve(__dirname, '../shared-content'),
    collections: { posts, pages },
  }),
)

// ── Helpers ──

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function writePage(relPath: string, html: string): void {
  const outPath = join(distDir, relPath)
  ensureDir(dirname(outPath))
  writeFileSync(outPath, html, 'utf-8')
  console.log(`  wrote ${relPath}`)
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Template ──

function htmlPage(opts: { title: string; css: string; js: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
  <style>${opts.css}</style>
</head>
<body>
  <header>
    <nav><a href="/">Home</a> &middot; <a href="/about/">About</a></nav>
  </header>
  <main>${opts.body}</main>
  <footer><p>Built with Pagesmith</p></footer>
  <script>${opts.js}</script>
</body>
</html>`
}

// ── Build ──

async function build(): Promise<void> {
  const start = performance.now()
  console.log('Building with-ssg...')

  ensureDir(distDir)

  const css = getContentCSS()
  const js = getContentJS()
  let pageCount = 0

  // Load collections
  const allPosts = await layer.getCollection('posts')
  const allPages = await layer.getCollection('pages')

  // Sort posts by date descending
  const sortedPosts = [...allPosts].sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  )

  // Render each post
  for (const post of sortedPosts) {
    const { html: content } = await post.render()
    const tags =
      (post.data.tags as string[]).length > 0
        ? `<p class="tags">${(post.data.tags as string[])
            .map((t) => `<span>${escapeHtml(t)}</span>`)
            .join(' ')}</p>`
        : ''

    const body = `
      <article>
        <h1>${escapeHtml(post.data.title as string)}</h1>
        <p class="meta"><time datetime="${formatDate(post.data.date as Date)}">${formatDate(
          post.data.date as Date,
        )}</time></p>
        ${tags}
        <div class="content">${content}</div>
      </article>`

    const html = htmlPage({
      title: post.data.title as string,
      css,
      js,
      body,
    })
    writePage(`posts/${post.slug}/index.html`, html)
    pageCount++
  }

  // Render index page (post listing)
  const listItems = sortedPosts
    .map(
      (p) => `
    <li>
      <a href="/posts/${p.slug}/">
        <strong>${escapeHtml(p.data.title as string)}</strong>
      </a>
      <time datetime="${formatDate(p.data.date as Date)}">${formatDate(p.data.date as Date)}</time>
      <p>${escapeHtml(p.data.description as string)}</p>
    </li>`,
    )
    .join('\n')

  const indexHtml = htmlPage({
    title: 'Blog',
    css,
    js,
    body: `
      <h1>Blog</h1>
      <ul class="post-list">${listItems}</ul>`,
  })
  writePage('index.html', indexHtml)
  pageCount++

  // Render about page
  const aboutEntry = allPages.find((p) => p.slug === 'about')
  if (aboutEntry) {
    const { html: aboutContent } = await aboutEntry.render()
    const aboutHtml = htmlPage({
      title: aboutEntry.data.title as string,
      css,
      js,
      body: `
        <article>
          <div class="content">${aboutContent}</div>
        </article>`,
    })
    writePage('about/index.html', aboutHtml)
    pageCount++
  }

  const elapsed = (performance.now() - start).toFixed(0)
  console.log(`\n  ${pageCount} pages generated in ${elapsed}ms`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
