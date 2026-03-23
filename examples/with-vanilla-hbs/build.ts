/**
 * Vanilla Node.js + Handlebars build script.
 *
 * Demonstrates using @pagesmith/content with plain Handlebars templates
 * — no framework, no bundler, just content + templates -> HTML.
 */

import { createContentLayer, defineConfig } from '@pagesmith/content'
import { getContentCSS, getContentJS } from '@pagesmith/content/runtime'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import Handlebars from 'handlebars'
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
  return readFileSync(join(templatesDir, `${name}.hbs`), 'utf-8')
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

// ── Register Handlebars partials & helpers ──

Handlebars.registerPartial('layout', loadTemplate('layout'))

Handlebars.registerHelper('formatDate', (date: Date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

// ── Build ──

async function build(): Promise<void> {
  const start = performance.now()
  console.log('Building with-vanilla-hbs...')

  ensureDir(distDir)

  const css = getContentCSS()
  const js = getContentJS()
  const postTemplate = Handlebars.compile(loadTemplate('post'))
  const indexTemplate = Handlebars.compile(loadTemplate('index'))
  const aboutTemplate = Handlebars.compile(loadTemplate('about'))

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
    const html = postTemplate({
      title: post.data.title,
      date: post.data.date,
      tags: post.data.tags,
      content,
      headings,
      basePath,
      css,
      js,
    })
    writePage(`posts/${post.slug}/index.html`, html)
  }

  // Render index page
  const indexHtml = indexTemplate({
    title: 'Blog',
    posts: sortedPosts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      date: p.data.date,
      slug: p.slug,
    })),
    basePath,
    css,
    js,
  })
  writePage('index.html', indexHtml)

  // Render about page
  const aboutEntry = allPages.find((p) => p.slug === 'about')
  if (aboutEntry) {
    const { html: aboutContent } = await aboutEntry.render()
    const aboutHtml = aboutTemplate({
      title: aboutEntry.data.title,
      content: aboutContent,
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
