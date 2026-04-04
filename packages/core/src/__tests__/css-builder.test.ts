import { existsSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vite-plus/test'
import { buildCss } from '../css'

describe('buildCss', () => {
  const fixtureDir = resolve(import.meta.dirname, '..', 'styles')

  it('builds standalone CSS', () => {
    const standalonePath = resolve(fixtureDir, 'standalone.css')
    if (!existsSync(standalonePath)) return // Skip if path doesn't exist

    const result = buildCss(standalonePath, { minify: true })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    // Should contain CSS custom properties from design tokens
    expect(result).toContain('--color-')
  })

  it('builds content CSS', () => {
    const contentPath = resolve(fixtureDir, 'content.css')
    if (!existsSync(contentPath)) return

    const result = buildCss(contentPath, { minify: true })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('builds without minification', () => {
    const contentPath = resolve(fixtureDir, 'content.css')
    if (!existsSync(contentPath)) return

    const minified = buildCss(contentPath, { minify: true })
    const unminified = buildCss(contentPath, { minify: false })
    // Unminified should generally be longer (more whitespace)
    expect(unminified.length).toBeGreaterThanOrEqual(minified.length)
  })
})
