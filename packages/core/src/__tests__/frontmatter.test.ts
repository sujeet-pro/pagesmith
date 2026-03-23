import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { extractFrontmatter, validateFrontmatter } from '../frontmatter'

describe('extractFrontmatter', () => {
  it('extracts YAML frontmatter and body content', () => {
    const raw = `---
title: Hello World
tags:
  - typescript
  - testing
---

# Hello

Body content here.`

    const result = extractFrontmatter(raw)
    expect(result.frontmatter.title).toBe('Hello World')
    expect(result.frontmatter.tags).toEqual(['typescript', 'testing'])
    expect(result.content.trim()).toBe('# Hello\n\nBody content here.')
  })

  it('returns empty frontmatter for content without YAML block', () => {
    const raw = '# Just a heading\n\nSome content.'
    const result = extractFrontmatter(raw)
    expect(result.frontmatter).toEqual({})
    expect(result.content.trim()).toBe('# Just a heading\n\nSome content.')
  })
})

describe('validateFrontmatter', () => {
  const schema = z.object({
    title: z.string(),
    draft: z.boolean().optional(),
  })

  it('returns parsed data for valid frontmatter', () => {
    const result = validateFrontmatter({ title: 'Test Post' }, schema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Test Post')
    }
  })

  it('returns errors for invalid frontmatter', () => {
    const result = validateFrontmatter({ draft: 'not-a-boolean' }, schema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })
})
