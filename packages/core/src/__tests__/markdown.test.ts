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
      expect(result.html).toContain('ps-table-scroll')
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
    it('applies the built-in code renderer contract', async () => {
      const md = '```js title="app.js"\nconsole.log("hello")\n```'
      const result = await processMarkdown(md)
      expect(result.html).toContain('console')
      expect(result.html).toContain('hello')
      expect(result.html).toContain('ps-code-block')
      expect(result.html).toContain('data-ps-code-renderer="pagesmith"')
      expect(result.html).toContain('data-ps-code-title="app.js"')
      expect(result.html).toContain('ps-code-toolbar')
      expect(result.html).toContain('ps-code-copy')
      expect(result.html).toContain('data-ps-code-lang="js"')
    })

    it('renders line metadata, collapse controls, and frame options', async () => {
      const md = [
        '```ts title="demo.ts" showLineNumbers startLineNumber=10 mark={2} ins={3} del={4} collapse={1} wrap',
        'const a = 1',
        'const b = 2',
        'const c = 3',
        'const d = 4',
        '```',
        '',
        '```bash frame="terminal"',
        'npm install @pagesmith/core',
        '```',
        '',
        '```txt frame="none"',
        'plain text',
        '```',
      ].join('\n')

      const result = await processMarkdown(md)
      expect(result.html).toContain('data-ps-code-line-numbers="true"')
      expect(result.html).toContain('>10<')
      expect(result.html).toContain('ps-code-line--mark')
      expect(result.html).toContain('ps-code-line--ins')
      expect(result.html).toContain('ps-code-line--del')
      expect(result.html).toContain('data-ps-code-collapse="true"')
      expect(result.html).toContain('Show 1 hidden line')
      expect(result.html).toContain('data-ps-code-wrap="true"')
      expect(result.html).toContain('data-ps-code-frame="terminal"')
      expect(result.html).toContain('ps-code-traffic-lights')
      expect(result.html).toContain('data-ps-code-frame="plain"')
      expect(result.html).toContain('ps-code-toolbar--plain')
    })

    it('honors multi-line range syntax for marks and collapsed sections', async () => {
      const md = [
        '```ts mark={1, 3-5} collapse={1-5}',
        'const a = 1',
        'const b = 2',
        'const c = 3',
        'const d = 4',
        'const e = 5',
        'const f = 6',
        '```',
      ].join('\n')

      const result = await processMarkdown(md)
      const markedLines = result.html.match(/ps-code-line--mark/g) || []

      expect(markedLines.length).toBe(4)
      expect(result.html).toContain('Show 5 hidden lines')
      expect(result.html).toContain('Hide 5 hidden lines')
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
