import { describe, expect, it } from 'vite-plus/test'
import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { join } from 'path'

describe('docs quality guards', () => {
  it('keeps the guide onboarding series first for AI-first navigation', () => {
    const guideMetaPath = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'docs',
      'content',
      'guide',
      'meta.json5',
    )
    expect(existsSync(guideMetaPath)).toBe(true)

    const meta = JSON5.parse(readFileSync(guideMetaPath, 'utf-8')) as {
      series?: Array<{ slug?: string; articles?: string[] }>
    }

    expect(meta.series?.[0]?.slug).toBe('onboarding')
    expect(meta.series?.[0]?.articles).toEqual([
      'choose-your-path',
      'ai-assistants',
      'prompts-cookbook',
      'mcp-setup',
    ])
  })
})
