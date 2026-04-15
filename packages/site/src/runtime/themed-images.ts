/**
 * Theme-aware image runtime.
 *
 * Handles explicit color-scheme overrides (via class on <html>) for
 * `.ps-figure-themed` images.
 *
 * In auto mode (no forced class), `<picture>` media queries handle
 * light/dark selection natively — zero JS cost. This runtime only
 * intervenes when the scheme is explicitly forced to 'light' or 'dark'
 * via a CSS class, stripping sources down to the matching set.
 *
 * Detection uses a MutationObserver on the `class` attribute of <html>
 * with a cached-scheme guard, so unrelated class changes (text-size,
 * theme palette) are a single classList check with no DOM mutations.
 */

const THEMED_SELECTOR = '.ps-figure-themed'
const SCHEME_DARK = 'color-scheme-dark'
const SCHEME_LIGHT = 'color-scheme-light'
const DARK_MEDIA = '(prefers-color-scheme: dark)'

type OriginalSources = {
  sources: Array<{ srcset: string; type: string; media?: string }>
  imgSrc: string
}

const originals = new WeakMap<HTMLElement, OriginalSources>()
let lastScheme: 'light' | 'dark' | 'auto' | undefined
let teardown: (() => void) | undefined

function captureOriginals(figure: HTMLElement): OriginalSources {
  const cached = originals.get(figure)
  if (cached) return cached

  const picture = figure.querySelector('picture')
  if (!picture) {
    const empty: OriginalSources = { sources: [], imgSrc: '' }
    originals.set(figure, empty)
    return empty
  }

  const data: OriginalSources = {
    sources: Array.from(picture.querySelectorAll('source')).map((s) => ({
      srcset: s.getAttribute('srcset') || '',
      type: s.getAttribute('type') || '',
      media: s.getAttribute('media') || undefined,
    })),
    imgSrc: picture.querySelector('img')?.getAttribute('src') || '',
  }

  originals.set(figure, data)
  return data
}

function getEffectiveScheme(): 'light' | 'dark' | 'auto' {
  const cl = document.documentElement.classList
  if (cl.contains(SCHEME_DARK)) return 'dark'
  if (cl.contains(SCHEME_LIGHT)) return 'light'
  return 'auto'
}

function restoreOriginals(figure: HTMLElement): void {
  const data = captureOriginals(figure)
  if (data.sources.length === 0) return

  const picture = figure.querySelector('picture')
  if (!picture) return

  for (const el of picture.querySelectorAll('source')) el.remove()

  const img = picture.querySelector('img')
  for (const src of data.sources) {
    const el = document.createElement('source')
    el.setAttribute('srcset', src.srcset)
    el.setAttribute('type', src.type)
    if (src.media) el.setAttribute('media', src.media)
    picture.insertBefore(el, img)
  }

  if (img) img.setAttribute('src', data.imgSrc)
}

function forceScheme(figure: HTMLElement, scheme: 'light' | 'dark'): void {
  const data = captureOriginals(figure)
  if (data.sources.length === 0) return

  const picture = figure.querySelector('picture')
  if (!picture) return

  const isDark = scheme === 'dark'
  const matchingSources = data.sources.filter((s) => (isDark ? s.media === DARK_MEDIA : !s.media))

  for (const el of picture.querySelectorAll('source')) el.remove()

  const img = picture.querySelector('img')
  for (const src of matchingSources) {
    const el = document.createElement('source')
    el.setAttribute('srcset', src.srcset)
    el.setAttribute('type', src.type)
    picture.insertBefore(el, img)
  }

  if (img) {
    const fallback =
      matchingSources.find((s) => s.type === 'image/webp') ??
      matchingSources.find((s) => s.type === 'image/svg+xml') ??
      matchingSources[0]
    if (fallback) img.setAttribute('src', fallback.srcset)
  }
}

function updateAllThemedImages(): void {
  const scheme = getEffectiveScheme()
  if (scheme === lastScheme) return
  lastScheme = scheme

  for (const figure of document.querySelectorAll<HTMLElement>(THEMED_SELECTOR)) {
    if (scheme === 'auto') {
      restoreOriginals(figure)
    } else {
      forceScheme(figure, scheme)
    }
  }
}

export function initThemedImages(): void {
  teardown?.()
  lastScheme = undefined

  updateAllThemedImages()

  // Only fires on class attribute changes — not data attributes, style, etc.
  // The lastScheme guard ensures unrelated class changes (text-size, theme
  // palette) never cause DOM mutations — just a single classList check.
  const observer = new MutationObserver(() => updateAllThemedImages())
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  teardown = () => {
    observer.disconnect()
    teardown = undefined
  }
}
