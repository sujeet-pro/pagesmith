import { describe, expect, it } from 'vite-plus/test'
import { convert, extractFrontmatter, extractToc, processMarkdown } from '@pagesmith/core'

describe('markdown pipeline', () => {
  it('converts markdown to HTML with headings', async () => {
    const md = '# Hello\n\nParagraph text.\n\n## Subheading\n\nMore text.'
    const result = await processMarkdown(md)
    expect(result.html).toContain('<h1')
    expect(result.html).toContain('Hello')
    expect(result.html).toContain('<h2')
    expect(result.headings.length).toBeGreaterThanOrEqual(2)
  })

  it('processes GFM features (tables, task lists, strikethrough)', async () => {
    const md = `
| Col A | Col B |
|-------|-------|
| a1    | b1    |

- [x] Done
- [ ] Todo

~~deleted~~
`
    const result = await processMarkdown(md)
    expect(result.html).toContain('<table')
    expect(result.html).toContain('<input')
    expect(result.html).toContain('<del>')
  })

  it('highlights code blocks with the built-in Pagesmith renderer', async () => {
    const md = '```typescript\nconst x: number = 42\n```'
    const result = await processMarkdown(md)
    expect(result.html).toContain('ps-code-block')
    expect(result.html).toContain('data-ps-code-renderer="pagesmith"')
    expect(result.html).toContain('42')
  })

  it('extracts frontmatter from markdown', () => {
    const md = '---\ntitle: Test\ndescription: A test\n---\n\n# Content'
    const { frontmatter, content } = extractFrontmatter(md)
    expect(frontmatter.title).toBe('Test')
    expect(frontmatter.description).toBe('A test')
    expect(content).toContain('# Content')
  })

  it('extracts TOC from rendered HTML', async () => {
    const md = '# Title\n\n## Section 1\n\n### Subsection\n\n## Section 2'
    const result = await processMarkdown(md)
    const toc = extractToc(result.html)
    expect(toc.length).toBeGreaterThanOrEqual(2)
    expect(toc.some((h) => h.text === 'Section 1')).toBe(true)
  })

  it('converts markdown via convert() API', async () => {
    const md = '---\ntitle: Test Page\n---\n\n# Hello World'
    const result = await convert(md)
    expect(result.html).not.toContain('<!DOCTYPE')
    expect(result.html).toContain('Hello World')
    expect(result.frontmatter.title).toBe('Test Page')
  })

  it('converts markdown fragment', async () => {
    const md = '# Fragment\n\nJust content.'
    const result = await convert(md)
    expect(result.html).not.toContain('<!DOCTYPE')
    expect(result.html).toContain('Fragment')
  })
})
