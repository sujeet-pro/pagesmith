import { describe, expect, it } from 'vite-plus/test'
import { Fragment, h, HtmlString } from '../jsx-runtime'

describe('h', () => {
  it('produces <div>text</div> for h("div", null, "text")', () => {
    const result = h('div', null, 'text')
    expect(result.value).toBe('<div>text</div>')
  })

  it('produces correct HTML with class attribute', () => {
    const result = h('div', { class: 'foo' }, 'text')
    expect(result.value).toBe('<div class="foo">text</div>')
  })

  it('produces void element for <br>', () => {
    const result = h('br', null)
    expect(result.value).toBe('<br>')
  })

  it('produces void element with attributes for <img>', () => {
    const result = h('img', { src: 'x.png', alt: 'test' })
    expect(result.value).toBe('<img src="x.png" alt="test">')
  })

  it('maps className prop to class attribute', () => {
    const result = h('div', { className: 'bar' }, 'text')
    expect(result.value).toBe('<div class="bar">text</div>')
  })

  it('escapes HTML in text content', () => {
    const result = h('div', null, '<script>alert("xss")</script>')
    expect(result.value).toBe('<div>&lt;script&gt;alert("xss")&lt;/script&gt;</div>')
  })

  it('escapes HTML entities in text', () => {
    const result = h('div', null, 'a & b < c > d')
    expect(result.value).toBe('<div>a &amp; b &lt; c &gt; d</div>')
  })

  it('escapes quotes in attributes', () => {
    const result = h('div', { title: 'say "hello"' })
    expect(result.value).toBe('<div title="say &quot;hello&quot;"></div>')
  })

  it('escapes ampersands in attributes', () => {
    const result = h('a', { href: '?a=1&b=2' }, 'link')
    expect(result.value).toBe('<a href="?a=1&amp;b=2">link</a>')
  })

  it('HtmlString prevents double-escaping', () => {
    const raw = new HtmlString('<strong>bold</strong>')
    const result = h('div', null, raw)
    expect(result.value).toBe('<div><strong>bold</strong></div>')
  })

  it('renders nested elements', () => {
    const result = h('div', null, h('span', null, 'inner'))
    expect(result.value).toBe('<div><span>inner</span></div>')
  })

  it('renders multiple children', () => {
    const result = h('div', null, h('span', null, 'a'), h('span', null, 'b'))
    expect(result.value).toBe('<div><span>a</span><span>b</span></div>')
  })

  it('handles boolean attribute (true)', () => {
    const result = h('input', { disabled: true })
    expect(result.value).toBe('<input disabled>')
  })

  it('omits boolean attribute when false', () => {
    const result = h('input', { disabled: false })
    expect(result.value).toBe('<input>')
  })

  it('omits null/undefined attributes', () => {
    const result = h('div', { title: null, id: undefined }, 'text')
    expect(result.value).toBe('<div>text</div>')
  })

  it('renders innerHTML without escaping', () => {
    const result = h('div', { innerHTML: '<em>raw</em>' })
    expect(result.value).toBe('<div><em>raw</em></div>')
  })

  it('renders innerHTML as HtmlString without double-escaping', () => {
    const result = h('div', { innerHTML: new HtmlString('<em>raw</em>') })
    expect(result.value).toBe('<div><em>raw</em></div>')
  })

  it('renders function components', () => {
    function Greeting(props: { name: string }) {
      return h('span', null, `Hello, ${props.name}!`)
    }
    const result = h(Greeting, { name: 'World' })
    expect(result.value).toBe('<span>Hello, World!</span>')
  })

  it('passes children to function components', () => {
    function Wrapper(props: { children: unknown }) {
      return h('section', null, props.children)
    }
    const result = h(Wrapper, null, h('p', null, 'inside'))
    expect(result.value).toBe('<section><p>inside</p></section>')
  })

  it('renders numbers as text content', () => {
    const result = h('span', null, 42)
    expect(result.value).toBe('<span>42</span>')
  })

  it('skips null and boolean children', () => {
    const result = h('div', null, null, false, true, 'visible')
    expect(result.value).toBe('<div>visible</div>')
  })

  it('renders empty div when no children', () => {
    const result = h('div', null)
    expect(result.value).toBe('<div></div>')
  })
})

describe('Fragment', () => {
  it('renders children without wrapper element', () => {
    const result = Fragment({ children: [h('span', null, 'a'), h('span', null, 'b')] })
    expect(result.value).toBe('<span>a</span><span>b</span>')
  })

  it('renders single child without wrapper', () => {
    const result = Fragment({ children: 'just text' })
    expect(result.value).toBe('just text')
  })

  it('renders innerHTML directly', () => {
    const result = Fragment({ innerHTML: '<div>raw</div>' })
    expect(result.value).toBe('<div>raw</div>')
  })

  it('renders empty fragment', () => {
    const result = Fragment({})
    expect(result.value).toBe('')
  })
})

describe('HtmlString', () => {
  it('toString returns the raw value', () => {
    const s = new HtmlString('<p>hello</p>')
    expect(s.toString()).toBe('<p>hello</p>')
    expect(String(s)).toBe('<p>hello</p>')
  })

  it('value property holds the raw HTML', () => {
    const s = new HtmlString('test')
    expect(s.value).toBe('test')
  })
})
