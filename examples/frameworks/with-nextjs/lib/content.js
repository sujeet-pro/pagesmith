import { createContentLayer, defineConfig } from '@pagesmith/site'
import collections from '../content.config.js'

let layer

function getLayer() {
  if (!layer) {
    layer = createContentLayer(
      defineConfig({
        root: process.cwd(),
        collections,
      }),
    )
  }
  return layer
}

function serializeDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString()
}

function byNewestDate(left, right) {
  return new Date(right.date).getTime() - new Date(left.date).getTime()
}

async function renderPostEntry(entry) {
  const rendered = await entry.render()

  return {
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    date: serializeDate(entry.data.date),
    tags: entry.data.tags ?? [],
    html: rendered.html,
    headings: rendered.headings,
    readTime: rendered.readTime,
  }
}

export async function getAllPosts() {
  const entries = await getLayer().getCollection('posts')
  const posts = await Promise.all(entries.map((entry) => renderPostEntry(entry)))
  return posts.sort(byNewestDate)
}

export async function getPostBySlug(slug) {
  const entry = await getLayer().getEntry('posts', slug)

  if (!entry) return null
  return renderPostEntry(entry)
}
