import { describe, expect, it } from 'vite-plus/test'
import { getContentJS, getContentJSPath, getRuntimeJS, getRuntimeJSPath } from '../runtime'

describe('runtime exports', () => {
  it('returns a self-contained content runtime source', () => {
    const js = getContentJS()
    expect(js).toContain('data-ps-code-copy')
    expect(js).toContain('ps-code-tabs-ready')
    expect(js).toContain('initCodeBlocks()')
    expect(js).toContain('initCodeTabs()')
  })

  it('returns a self-contained standalone runtime source', () => {
    const js = getRuntimeJS()
    expect(js).toContain('data-ps-code-copy')
    expect(js).toContain('IntersectionObserver')
    expect(js).toContain('initTocHighlight()')
  })

  it('resolves built runtime entry paths', () => {
    expect(getContentJSPath()).toMatch(/runtime[\\/]+content\.(mjs|js|ts)$/)
    expect(getRuntimeJSPath()).toMatch(/runtime[\\/]+standalone\.(mjs|js|ts)$/)
  })
})
