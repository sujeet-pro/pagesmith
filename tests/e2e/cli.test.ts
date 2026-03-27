import { describe, expect, it } from 'vite-plus/test'
import { resolve } from 'path'
import { convert, extractToc } from '@pagesmith/core'
import { readFileSync } from 'fs'

const FIXTURES = resolve(import.meta.dirname, '../../examples/shared-content')

describe('cli (programmatic equivalents)', () => {
  it('converts markdown to full HTML', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md, { mode: 'full' })
    expect(result.html).toContain('<html')
    expect(result.html).toContain('</html>')
    expect(result.html).toContain('Hello World')
    expect(result.frontmatter.title).toBe('Hello World')
  })

  it('converts markdown to fragment HTML', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md, { mode: 'fragment' })
    expect(result.html).not.toContain('<!DOCTYPE')
    expect(result.html).toContain('Hello World')
  })

  it('extracts TOC from markdown', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md, { mode: 'fragment' })
    expect(result.toc.length).toBeGreaterThan(0)
    expect(result.toc.some((h) => h.text.includes('Hello World'))).toBe(true)
  })

  it('extracts TOC from rendered HTML', async () => {
    const md = '# Title\n\n## Section A\n\n## Section B'
    const result = await convert(md, { mode: 'fragment' })
    const toc = extractToc(result.html)
    expect(toc.length).toBeGreaterThanOrEqual(2)
  })

  it('converts markdown with code highlighting', async () => {
    const md = readFileSync(resolve(FIXTURES, 'posts/hello-world.md'), 'utf-8')
    const result = await convert(md, { mode: 'fragment' })
    // hello-world.md has code blocks with syntax highlighting
    expect(result.html).toContain('shiki')
  })
})
