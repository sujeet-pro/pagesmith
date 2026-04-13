import { createContentLayer, defineConfig } from '@pagesmith/core'
import collections from '../content.config.js'

function createLayer() {
  return createContentLayer(
    defineConfig({
      root: process.cwd(),
      collections,
    }),
  )
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
  const layer = createLayer()
  const entries = await layer.getCollection('posts')
  const posts = await Promise.all(entries.map((entry) => renderPostEntry(entry)))
  return posts.sort(byNewestDate)
}

export async function getPostBySlug(slug) {
  const layer = createLayer()
  const entry = await layer.getEntry('posts', slug)

  if (!entry) return null
  return renderPostEntry(entry)
}
