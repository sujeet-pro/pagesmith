import { describe, expect, it } from 'vite-plus/test'
import { resolve } from 'path'
import { convert, extractToc } from '@pagesmith/core'
import { readFileSync } from 'fs'

const FIXTURES = resolve(import.meta.dirname, '../../examples/shared-content')

describe('cli (programmatic equivalents)', () => {
  it('converts markdown to HTML', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md)
    expect(result.html).toContain('Hello World')
    expect(result.frontmatter.title).toBe('Hello World')
  })

  it('returns HTML fragment without document wrapper', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md)
    expect(result.html).not.toContain('<!DOCTYPE')
    expect(result.html).toContain('Hello World')
  })

  it('extracts TOC from markdown', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md)
    expect(result.toc.length).toBeGreaterThan(0)
    expect(result.toc.some((h) => h.text.includes('Hello World'))).toBe(true)
  })

  it('extracts TOC from rendered HTML', async () => {
    const md = '# Title\n\n## Section A\n\n## Section B'
    const result = await convert(md)
    const toc = extractToc(result.html)
    expect(toc.length).toBeGreaterThanOrEqual(2)
  })

  it('converts markdown with code highlighting', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md)
    // hello-world.md has code blocks with syntax highlighting
    expect(result.html).toContain('expressive-code')
  })
})
