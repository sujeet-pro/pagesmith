/**
 * Active TOC highlighting via IntersectionObserver.
 *
 * Progressive enhancement — TOC works without this, but with JS
 * the currently visible section gets highlighted in the right sidebar.
 * When the active heading changes, the TOC scrolls to keep it visible.
 */

export function initTocHighlight(): void {
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.sidebar-right .toc-item a')
  if (tocLinks.length === 0) return

  const headingIds = Array.from(tocLinks)
    .map((a) => a.getAttribute('href')?.slice(1))
    .filter((id): id is string => !!id)

  const headings = headingIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)

  if (headings.length === 0) return

  // Track which headings are currently visible
  const visibleIds = new Set<string>()
  let currentId = ''

  function updateActive() {
    const prevId = currentId
    // Pick the first heading in document order that is visible
    currentId = ''
    for (const id of headingIds) {
      if (visibleIds.has(id)) {
        currentId = id
        break
      }
    }
    // Update TOC active state
    tocLinks.forEach((link) => {
      const li = link.parentElement
      if (li) {
        li.classList.toggle('active', link.getAttribute('href') === `#${currentId}`)
      }
    })
    // Scroll active TOC item into view when it changes
    if (currentId !== prevId) {
      const activeLi = document.querySelector(
        '.sidebar-right .toc-item.active',
      ) as HTMLElement | null
      if (activeLi) {
        activeLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleIds.add(entry.target.id)
        } else {
          visibleIds.delete(entry.target.id)
        }
      }
      updateActive()
    },
    {
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0,
    },
  )

  headings.forEach((h) => observer.observe(h))
}
