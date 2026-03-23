/**
 * Vanilla Node.js + EJS build script.
 *
 * Demonstrates using @pagesmith/content with plain EJS templates
 * — no framework, no bundler, just content + templates -> HTML.
 */

import { createContentLayer, defineConfig } from '@pagesmith/content'
import { getContentCSS, getContentJS } from '@pagesmith/content/runtime'
import ejs from 'ejs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { pages, posts } from '../shared-content/content.config.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, 'dist')
const templatesDir = resolve(__dirname, 'templates')
const basePath = process.env.BASE_URL || '/'

// ── Content layer ──

const layer = createContentLayer(
  defineConfig({
    root: resolve(__dirname, '../shared-content'),
    collections: { posts, pages },
  }),
)

// ── Template helpers ──

function loadTemplate(name: string): string {
  return readFileSync(join(templatesDir, `${name}.ejs`), 'utf-8')
}

function renderWithLayout(
  body: string,
  vars: { title: string; basePath: string; css: string; js: string },
): string {
  const layout = loadTemplate('layout')
  return ejs.render(layout, { ...vars, body })
}

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

// ── Build ──

async function build(): Promise<void> {
  const start = performance.now()
  console.log('Building with-vanilla-ejs...')

  ensureDir(distDir)

  const css = getContentCSS()
  const js = getContentJS()
  const postTemplate = loadTemplate('post')
  const indexTemplate = loadTemplate('index')
  const aboutTemplate = loadTemplate('about')

  // Load collections
  const allPosts = await layer.getCollection('posts')
  const allPages = await layer.getCollection('pages')

  // Sort posts by date descending
  const sortedPosts = [...allPosts].sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  )

  // Render each post
  for (const post of sortedPosts) {
    const { html: content, headings } = await post.render()
    const body = ejs.render(postTemplate, {
      title: post.data.title,
      date: post.data.date,
      tags: post.data.tags,
      content,
      headings,
      basePath,
    })
    const html = renderWithLayout(body, {
      title: post.data.title,
      basePath,
      css,
      js,
    })
    writePage(`posts/${post.slug}/index.html`, html)
  }

  // Render index page
  const indexBody = ejs.render(indexTemplate, {
    posts: sortedPosts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      date: p.data.date,
      slug: p.slug,
    })),
    basePath,
  })
  const indexHtml = renderWithLayout(indexBody, {
    title: 'Blog',
    basePath,
    css,
    js,
  })
  writePage('index.html', indexHtml)

  // Render about page
  const aboutEntry = allPages.find((p) => p.slug === 'about')
  if (aboutEntry) {
    const { html: aboutContent } = await aboutEntry.render()
    const aboutBody = ejs.render(aboutTemplate, {
      title: aboutEntry.data.title,
      content: aboutContent,
      basePath,
    })
    const aboutHtml = renderWithLayout(aboutBody, {
      title: aboutEntry.data.title,
      basePath,
      css,
      js,
    })
    writePage('about/index.html', aboutHtml)
  }

  const elapsed = (performance.now() - start).toFixed(0)
  console.log(`Done in ${elapsed}ms`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
