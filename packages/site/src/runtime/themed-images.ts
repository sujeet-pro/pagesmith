/**
 * Theme-aware image runtime.
 *
 * Handles explicit color-scheme overrides (via class on <html>) for
 * `.ps-figure-themed` images. When the scheme is 'auto', <picture> media
 * queries handle selection natively. When forced to 'light' or 'dark',
 * this script swaps <source> srcsets and <img> src to match.
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
let activeObserver: MutationObserver | undefined

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
  // Use classList for exact token matching (avoids substring false positives)
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

  // Remove all current sources and rebuild from originals
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

  // Remove all current sources
  for (const el of picture.querySelectorAll('source')) el.remove()

  // Add only the matching sources (without media queries — force them)
  const img = picture.querySelector('img')
  for (const src of matchingSources) {
    const el = document.createElement('source')
    el.setAttribute('srcset', src.srcset)
    el.setAttribute('type', src.type)
    picture.insertBefore(el, img)
  }

  // Update img src to matching webp
  if (img) {
    const webpSource = matchingSources.find((s) => s.type === 'image/webp')
    if (webpSource) img.setAttribute('src', webpSource.srcset)
  }
}

function updateAllThemedImages(): void {
  const scheme = getEffectiveScheme()
  for (const figure of document.querySelectorAll<HTMLElement>(THEMED_SELECTOR)) {
    if (scheme === 'auto') {
      restoreOriginals(figure)
    } else {
      forceScheme(figure, scheme)
    }
  }
}

export function initThemedImages(): void {
  // Disconnect any prior observer (safe to call multiple times)
  if (activeObserver) {
    activeObserver.disconnect()
    activeObserver = undefined
  }

  // Initial pass
  updateAllThemedImages()

  // Re-run when theme changes (className mutation on <html>)
  activeObserver = new MutationObserver(() => updateAllThemedImages())
  activeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}
