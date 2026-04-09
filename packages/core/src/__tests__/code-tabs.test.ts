import { describe, expect, it } from 'vite-plus/test'
import { processMarkdown } from '../markdown/pipeline'

describe('code tabs', () => {
  it('groups consecutive titled code blocks into a tab container', async () => {
    const md = [
      '```js title="npm"',
      'npm install foo',
      '```',
      '',
      '```js title="pnpm"',
      'pnpm add foo',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).toContain('ps-code-tabs')
    expect(result.html).toContain('role="tablist"')
    expect(result.html).toContain('role="tab"')
    expect(result.html).toContain('role="tabpanel"')
  })

  it('uses titles as tab button labels', async () => {
    const md = [
      '```bash title="npm"',
      'npm install',
      '```',
      '',
      '```bash title="yarn"',
      'yarn install',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).toContain('>npm<')
    expect(result.html).toContain('>yarn<')
  })

  it('sets the first tab as active', async () => {
    const md = [
      '```ts title="First"',
      'const a = 1',
      '```',
      '',
      '```ts title="Second"',
      'const b = 2',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).toContain('aria-selected="true"')
    expect(result.html).toContain('aria-selected="false"')
  })

  it('sets hidden attribute on non-active panels', async () => {
    const md = [
      '```ts title="A"',
      'const a = 1',
      '```',
      '',
      '```ts title="B"',
      'const b = 2',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    // First panel should not be hidden, second should
    const panels = result.html.match(/role="tabpanel"[^>]*/g) || []
    expect(panels.length).toBe(2)
    expect(panels[0]).not.toContain('hidden')
    expect(panels[1]).toContain('hidden')
  })

  it('does not group a single titled block', async () => {
    const md = ['```ts title="Only One"', 'const x = 1', '```'].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).not.toContain('ps-code-tabs')
    expect(result.html).toContain('expressive-code')
  })

  it('does not group when an untitled block breaks the run', async () => {
    const md = [
      '```ts title="First"',
      'const a = 1',
      '```',
      '',
      '```ts',
      'const untitled = true',
      '```',
      '',
      '```ts title="Third"',
      'const c = 3',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    // None of these should be grouped since the untitled block breaks the run
    expect(result.html).not.toContain('ps-code-tabs')
  })

  it('does not group when a paragraph separates titled blocks', async () => {
    const md = [
      '```ts title="Before"',
      'const a = 1',
      '```',
      '',
      'Some paragraph text between blocks.',
      '',
      '```ts title="After"',
      'const b = 2',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).not.toContain('ps-code-tabs')
  })

  it('groups three or more consecutive titled blocks', async () => {
    const md = [
      '```bash title="npm"',
      'npm install foo',
      '```',
      '',
      '```bash title="pnpm"',
      'pnpm add foo',
      '```',
      '',
      '```bash title="yarn"',
      'yarn add foo',
      '```',
      '',
      '```bash title="bun"',
      'bun add foo',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    const tabButtons = result.html.match(/role="tab"/g) || []
    const tabPanels = result.html.match(/role="tabpanel"/g) || []
    expect(tabButtons.length).toBe(4)
    expect(tabPanels.length).toBe(4)
  })

  it('creates aria-controls/aria-labelledby pairs', async () => {
    const md = [
      '```ts title="A"',
      'const a = 1',
      '```',
      '',
      '```ts title="B"',
      'const b = 2',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    // Tab 0 should control panel 0
    expect(result.html).toContain('aria-controls="ct-0-p0"')
    expect(result.html).toContain('id="ct-0-p0"')
    expect(result.html).toContain('aria-labelledby="ct-0-t0"')
    expect(result.html).toContain('id="ct-0-t0"')
  })

  it('handles multiple separate tab groups on the same page', async () => {
    const md = [
      '```ts title="Group1-A"',
      'const a = 1',
      '```',
      '',
      '```ts title="Group1-B"',
      'const b = 2',
      '```',
      '',
      'Paragraph separating the groups.',
      '',
      '```ts title="Group2-A"',
      'const c = 3',
      '```',
      '',
      '```ts title="Group2-B"',
      'const d = 4',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    // Both groups should have tab containers
    const tabGroups = result.html.match(/ps-code-tabs"/g) || []
    expect(tabGroups.length).toBe(2)
    // Different group IDs
    expect(result.html).toContain('ct-0-t0')
    expect(result.html).toContain('ct-1-t0')
  })

  it('preserves EC code content within tab panels', async () => {
    const md = [
      '```js title="JavaScript"',
      'console.log("hello")',
      '```',
      '',
      '```python title="Python"',
      'print("hello")',
      '```',
    ].join('\n')

    const result = await processMarkdown(md)
    expect(result.html).toContain('console')
    expect(result.html).toContain('hello')
    expect(result.html).toContain('print')
  })
})
