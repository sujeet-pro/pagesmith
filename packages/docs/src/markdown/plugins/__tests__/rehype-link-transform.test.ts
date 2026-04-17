import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { describe, expect, it } from 'vite-plus/test'
import { runWithDocsTransformContext } from '../context'
import { rehypeLinkTransform } from '../rehype-link-transform'

/** Stand up a tiny content tree and return paths for the transform context. */
function makeSandbox() {
  const root = mkdtempSync(join(tmpdir(), 'pagesmith-rlt-'))
  const contentDir = join(root, 'content')
  const files: Record<string, string> = {
    'content/README.md': '# Home',
    'content/guide/a/README.md': '# A',
    'content/guide/a/index.md': '# A index', // shouldn't shadow README (README wins first)
    'content/guide/b.md': '# B flat',
    'content/reference/api/README.md': '# API',
    'content/guide/c/README.md': '# C',
  }
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, body)
  }
  return { root, contentDir }
}

async function render(
  markdown: string,
  currentFile: string,
  contentDir: string,
  opts: { basePath?: string; trailingSlash?: boolean } = {},
): Promise<string> {
  const html = await runWithDocsTransformContext(
    {
      basePath: opts.basePath ?? '',
      contentDir,
      filePath: currentFile,
      trailingSlash: opts.trailingSlash ?? false,
    },
    async () => {
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeLinkTransform)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(markdown)
      return String(file)
    },
  )
  return html
}

describe('rehypeLinkTransform', () => {
  const s = makeSandbox()

  it('rewrites ./guide/a/README.md to /guide/a', async () => {
    const html = await render(
      '[a](./guide/a/README.md)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="/guide/a"')
  })

  it('rewrites ./guide/a/README.md to /guide/a/ when trailingSlash is on', async () => {
    const html = await render(
      '[a](./guide/a/README.md)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
      { trailingSlash: true },
    )
    expect(html).toContain('href="/guide/a/"')
  })

  it('prefixes basePath', async () => {
    const html = await render(
      '[a](./guide/a/README.md)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
      { basePath: '/pagesmith' },
    )
    expect(html).toContain('href="/pagesmith/guide/a"')
  })

  it('handles flat ./guide/b.md', async () => {
    const html = await render('[b](./guide/b.md)', join(s.contentDir, 'README.md'), s.contentDir)
    expect(html).toContain('href="/guide/b"')
  })

  it('handles ../../reference/api/README.md from a nested page', async () => {
    const html = await render(
      '[api](../../reference/api/README.md)',
      join(s.contentDir, 'guide/a/README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="/reference/api"')
  })

  it('preserves ?query and #anchor suffixes', async () => {
    const html = await render(
      '[a](./guide/a/README.md?tab=one#section)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="/guide/a?tab=one#section"')
  })

  it('leaves external URLs untouched', async () => {
    const html = await render(
      '[ext](https://example.com/path)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="https://example.com/path"')
  })

  it('leaves mailto: and tel: schemes untouched', async () => {
    const html = await render(
      '[mail](mailto:hi@example.com) [phone](tel:+15555550123)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="mailto:hi@example.com"')
    expect(html).toContain('href="tel:+15555550123"')
  })

  it('leaves fragment-only links untouched', async () => {
    const html = await render('[sec](#section)', join(s.contentDir, 'README.md'), s.contentDir)
    expect(html).toContain('href="#section"')
  })

  it('rewrites absolute /guide/a under basePath', async () => {
    const html = await render('[a](/guide/a)', join(s.contentDir, 'README.md'), s.contentDir, {
      basePath: '/pagesmith',
    })
    expect(html).toContain('href="/pagesmith/guide/a"')
  })

  it('does not double-prefix basePath on already-prefixed absolute links', async () => {
    const html = await render(
      '[a](/pagesmith/guide/a)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
      { basePath: '/pagesmith' },
    )
    expect(html).toContain('href="/pagesmith/guide/a"')
    expect(html).not.toContain('/pagesmith/pagesmith/')
  })

  it('adds trailing slash when trailingSlash is true for absolute paths', async () => {
    const html = await render('[a](/guide/a)', join(s.contentDir, 'README.md'), s.contentDir, {
      basePath: '/pagesmith',
      trailingSlash: true,
    })
    expect(html).toContain('href="/pagesmith/guide/a/"')
  })

  it('strips trailing slash when trailingSlash is false', async () => {
    const html = await render('[a](/guide/a/)', join(s.contentDir, 'README.md'), s.contentDir, {
      basePath: '/pagesmith',
      trailingSlash: false,
    })
    expect(html).toContain('href="/pagesmith/guide/a"')
  })

  it('leaves paths with file extensions alone', async () => {
    const html = await render(
      '[doc](/prompts/setup-core.md)',
      join(s.contentDir, 'README.md'),
      s.contentDir,
    )
    expect(html).toContain('href="/prompts/setup-core.md"')
  })
})
