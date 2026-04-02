import { describe, expect, it } from 'vite-plus/test'
import { processMarkdown } from '../markdown/pipeline'

describe('processMarkdown', () => {
  it('converts basic markdown to HTML', async () => {
    const result = await processMarkdown('# Hello\n\nWorld')
    expect(result.html).toContain('<h1')
    expect(result.html).toContain('Hello')
    expect(result.html).toContain('<p>World</p>')
  })

  it('converts empty markdown', async () => {
    const result = await processMarkdown('')
    expect(result.html).toBe('')
    expect(result.headings).toEqual([])
    expect(result.frontmatter).toEqual({})
  })

  it('handles markdown with only frontmatter', async () => {
    const result = await processMarkdown('---\ntitle: Test\n---\n')
    expect(result.frontmatter.title).toBe('Test')
    // Only frontmatter, no body content produces empty or whitespace-only html
    expect(result.html.replace(/\s/g, '')).toBe('')
  })

  describe('frontmatter extraction', () => {
    it('extracts frontmatter from raw markdown', async () => {
      const md = '---\ntitle: Hello\ntags:\n  - a\n  - b\n---\n\nContent here.'
      const result = await processMarkdown(md)
      expect(result.frontmatter.title).toBe('Hello')
      expect(result.frontmatter.tags).toEqual(['a', 'b'])
      expect(result.html).toContain('Content here.')
    })

    it('uses preExtracted frontmatter when provided', async () => {
      const content = '# Pre-extracted\n\nBody text.'
      const frontmatter = { title: 'Pre-extracted Title' }
      const result = await processMarkdown('ignored raw', undefined, { content, frontmatter })
      expect(result.frontmatter.title).toBe('Pre-extracted Title')
      expect(result.html).toContain('Body text.')
    })
  })

  describe('heading extraction', () => {
    it('extracts headings with correct depth, text, and slug', async () => {
      const md = '# First\n\n## Second\n\n### Third'
      const result = await processMarkdown(md)
      expect(result.headings.length).toBe(3)
      expect(result.headings[0]).toMatchObject({ depth: 1, text: 'First' })
      expect(result.headings[1]).toMatchObject({ depth: 2, text: 'Second' })
      expect(result.headings[2]).toMatchObject({ depth: 3, text: 'Third' })
      // rehype-slug should generate id slugs
      expect(result.headings[0].slug).toBe('first')
      expect(result.headings[1].slug).toBe('second')
      expect(result.headings[2].slug).toBe('third')
    })
  })

  describe('GFM features', () => {
    it('renders tables', async () => {
      const md = '| A | B |\n|---|---|\n| 1 | 2 |'
      const result = await processMarkdown(md)
      expect(result.html).toContain('<table>')
      expect(result.html).toContain('<td>1</td>')
      expect(result.html).toContain('<td>2</td>')
    })

    it('renders strikethrough', async () => {
      const md = '~~deleted~~'
      const result = await processMarkdown(md)
      expect(result.html).toContain('<del>deleted</del>')
    })
  })

  describe('code blocks', () => {
    it('applies Expressive Code treatment', async () => {
      const md = '```js\nconsole.log("hello")\n```'
      const result = await processMarkdown(md)
      // Expressive Code wraps code blocks in its own markup
      expect(result.html).toContain('console')
      expect(result.html).toContain('hello')
      // EC generates a figure with specific classes/attributes
      expect(result.html).toContain('expressive-code')
    })
  })

  describe('external links', () => {
    it('adds target="_blank" and rel="noopener noreferrer" to external links', async () => {
      const md = '[Example](https://example.com)'
      const result = await processMarkdown(md)
      expect(result.html).toContain('target="_blank"')
      expect(result.html).toContain('noopener')
      expect(result.html).toContain('noreferrer')
    })
  })

  describe('math rendering', () => {
    it('renders inline math', async () => {
      const md = 'Inline $x^2$ math'
      const result = await processMarkdown(md)
      // MathJax renders to SVG
      expect(result.html).toContain('mjx-container')
    })

    it('renders block math', async () => {
      // Use double-dollar on same line to ensure remark-math picks it up as display math
      const md = '$$x^2 + y^2 = z^2$$'
      const result = await processMarkdown(md)
      expect(result.html).toContain('mjx-container')
    })
  })

  describe('GitHub alerts', () => {
    it('renders a note alert', async () => {
      const md = '> [!NOTE]\n> This is a note.'
      const result = await processMarkdown(md)
      expect(result.html).toContain('markdown-alert')
      expect(result.html).toContain('This is a note.')
    })

    it('renders a warning alert', async () => {
      const md = '> [!WARNING]\n> Be careful.'
      const result = await processMarkdown(md)
      expect(result.html).toContain('markdown-alert')
      expect(result.html).toContain('Be careful.')
    })
  })

  describe('user plugins', () => {
    it('applies custom remark plugin', async () => {
      // A simple remark plugin that adds a class to paragraphs
      const customRemark = () => (tree: any) => {
        const visit = (node: any) => {
          if (node.type === 'paragraph') {
            node.data = node.data || {}
            node.data.hProperties = node.data.hProperties || {}
            node.data.hProperties.className = 'custom-paragraph'
          }
          if (node.children) node.children.forEach(visit)
        }
        visit(tree)
      }

      const result = await processMarkdown('Hello world', { remarkPlugins: [customRemark] })
      expect(result.html).toContain('custom-paragraph')
    })

    it('applies custom rehype plugin', async () => {
      // A simple rehype plugin that adds data-custom to all p elements
      const customRehype = () => (tree: any) => {
        const visit = (node: any) => {
          if (node.type === 'element' && node.tagName === 'p') {
            node.properties = node.properties || {}
            node.properties['data-custom'] = 'true'
          }
          if (node.children) node.children.forEach(visit)
        }
        visit(tree)
      }

      const result = await processMarkdown('Hello world', { rehypePlugins: [customRehype] })
      expect(result.html).toContain('data-custom="true"')
    })
  })
})
