import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { initTocHighlight } from './toc-highlight.js'

type MockHeading = {
  id: string
  scrollIntoView: ReturnType<typeof vi.fn>
  getBoundingClientRect: () => { top: number }
}

type MockListItem = {
  active: boolean
  classList: {
    toggle: (token: string, force?: boolean) => void
  }
  scrollIntoView: ReturnType<typeof vi.fn>
  getClientRects: () => Array<Record<string, never>>
}

type MockClickEvent = {
  preventDefault: ReturnType<typeof vi.fn>
}

type MockLink = {
  blur: ReturnType<typeof vi.fn>
  parentElement: MockListItem
  getAttribute: (name: string) => string | null
  addEventListener: (type: string, handler: (event: MockClickEvent) => void) => void
  triggerClick: () => MockClickEvent
}

type MockDetails = {
  open: boolean
  querySelectorAll: () => NodeListOf<HTMLAnchorElement>
}

type MockDocument = Pick<Document, 'querySelectorAll' | 'getElementById' | 'querySelector'>

type TestWindow = {
  location: { hash: string }
  history: {
    pushState: ReturnType<typeof vi.fn>
  }
  matchMedia: () => { matches: boolean }
  requestAnimationFrame: (callback: FrameRequestCallback) => number
}

type TestGlobals = typeof globalThis & {
  document?: Document
  window?: Window
  IntersectionObserver?: typeof IntersectionObserver
}

type MockObserverEntry = {
  isIntersecting: boolean
  target: MockHeading
}

const globals = globalThis as TestGlobals
const originalDocument = globals.document
const originalWindow = globals.window
const originalIntersectionObserver = globals.IntersectionObserver

class MockIntersectionObserver {
  static lastInstance: MockIntersectionObserver | null = null

  readonly observe = vi.fn()

  constructor(private readonly callback: (entries: MockObserverEntry[]) => void) {
    MockIntersectionObserver.lastInstance = this
  }

  trigger(entries: MockObserverEntry[]) {
    this.callback(entries)
  }
}

function createHeading(id: string): MockHeading {
  return {
    id,
    scrollIntoView: vi.fn(),
    getBoundingClientRect: () => ({ top: 0 }),
  }
}

function createListItem(visible = true): MockListItem {
  const item: MockListItem = {
    active: false,
    classList: {
      toggle(token, force) {
        if (token === 'active') item.active = Boolean(force)
      },
    },
    scrollIntoView: vi.fn(),
    getClientRects: () => (visible ? [{}] : []),
  }
  return item
}

function createLink(id: string, item: MockListItem): MockLink {
  let clickHandler: ((event: MockClickEvent) => void) | null = null

  return {
    blur: vi.fn(),
    parentElement: item,
    getAttribute(name) {
      return name === 'href' ? `#${id}` : null
    },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    },
    triggerClick() {
      const event = { preventDefault: vi.fn() }
      clickHandler?.(event)
      return event
    },
  }
}

function createWindow(initialHash = ''): Window {
  const win: TestWindow = {
    location: { hash: initialHash },
    history: {
      pushState: vi.fn((_, __, hash) => {
        if (typeof hash === 'string') win.location.hash = hash
      }),
    },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback) => {
      callback(0)
      return 1
    },
  }

  return win as unknown as Window
}

function createMobileToc(links: MockLink[]): MockDetails {
  return {
    open: true,
    querySelectorAll: () => links as unknown as NodeListOf<HTMLAnchorElement>,
  }
}

function installDom({
  mobileLinks,
  tocLinks,
  heading,
  desktopItem,
  mobileToc,
}: {
  mobileLinks?: MockLink[]
  tocLinks: MockLink[]
  heading: MockHeading
  desktopItem: MockListItem
  mobileToc?: MockDetails
}) {
  const doc: MockDocument = {
    querySelectorAll: () => tocLinks as unknown as NodeListOf<HTMLAnchorElement>,
    getElementById: (id) => (id === heading.id ? (heading as unknown as HTMLElement) : null),
    querySelector: (selector: string) => {
      if (selector === '.doc-toc-mobile') {
        return (mobileToc as unknown as Element | null) ?? null
      }

      return desktopItem.active ? (desktopItem as unknown as HTMLElement) : null
    },
  }

  globals.document = doc as Document
  globals.window = createWindow() as typeof globals.window
  globals.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}

function triggerVisibleHeading(heading: MockHeading) {
  const observer = MockIntersectionObserver.lastInstance
  if (!observer) throw new Error('Expected initTocHighlight() to create an observer')

  observer.trigger([
    {
      isIntersecting: true,
      target: heading,
    },
  ])
}

afterEach(() => {
  globals.document = originalDocument
  globals.window = originalWindow
  globals.IntersectionObserver = originalIntersectionObserver
  MockIntersectionObserver.lastInstance = null
  vi.restoreAllMocks()
})

describe('initTocHighlight', () => {
  it('scrolls the visible side TOC item instead of the mobile accordion item', () => {
    const heading = createHeading('using-core-without-vite')
    const mobileItem = createListItem()
    const desktopItem = createListItem()
    installDom({
      tocLinks: [
        createLink('using-core-without-vite', mobileItem),
        createLink('using-core-without-vite', desktopItem),
      ],
      heading,
      desktopItem,
    })

    initTocHighlight()
    triggerVisibleHeading(heading)

    expect(mobileItem.active).toBe(true)
    expect(desktopItem.active).toBe(true)
    expect(mobileItem.scrollIntoView).not.toHaveBeenCalled()
    expect(desktopItem.scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'smooth',
    })
  })

  it('skips auto-scrolling when the side TOC is hidden', () => {
    const heading = createHeading('using-core-without-vite')
    const mobileItem = createListItem()
    const hiddenDesktopItem = createListItem(false)
    installDom({
      tocLinks: [
        createLink('using-core-without-vite', mobileItem),
        createLink('using-core-without-vite', hiddenDesktopItem),
      ],
      heading,
      desktopItem: hiddenDesktopItem,
    })

    initTocHighlight()
    triggerVisibleHeading(heading)

    expect(mobileItem.active).toBe(true)
    expect(hiddenDesktopItem.active).toBe(true)
    expect(hiddenDesktopItem.scrollIntoView).not.toHaveBeenCalled()
  })

  it('closes the mobile accordion and scrolls to the target heading on link clicks', () => {
    const heading = createHeading('using-core-without-vite')
    const mobileItem = createListItem()
    const desktopItem = createListItem(false)
    const mobileLink = createLink('using-core-without-vite', mobileItem)
    const mobileToc = createMobileToc([mobileLink])
    installDom({
      mobileLinks: [mobileLink],
      tocLinks: [mobileLink],
      heading,
      desktopItem,
      mobileToc,
    })

    initTocHighlight()
    const event = mobileLink.triggerClick()

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mobileToc.open).toBe(false)
    expect(mobileLink.blur).toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globals.window?.history.pushState).toHaveBeenCalledWith(
      null,
      '',
      '#using-core-without-vite',
    )
    expect(heading.scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      behavior: 'smooth',
    })
  })
})
