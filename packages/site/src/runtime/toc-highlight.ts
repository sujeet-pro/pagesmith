/**
 * Active TOC highlighting via IntersectionObserver.
 *
 * Progressive enhancement — TOC works without this, but with JS
 * the currently visible section gets highlighted in the right sidebar.
 * When the active heading changes, the TOC scrolls to keep it visible.
 */

function getVisibleSideTocItem(): HTMLElement | null {
  const activeLi = document.querySelector<HTMLElement>(
    ".doc-aside [data-ps-toc] .doc-toc-item.active, .doc-aside [data-ps-toc] .toc-item.active, .sidebar-right [data-ps-toc] .doc-toc-item.active, .sidebar-right [data-ps-toc] .toc-item.active",
  );
  if (!activeLi || activeLi.getClientRects().length === 0) return null;
  return activeLi;
}

function getScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function scrollActiveTocItemIntoView(activeLi: HTMLElement): void {
  const container = getScrollableAncestor(activeLi);
  // Only scroll if the TOC has its own scroll container. Without one,
  // `scrollIntoView` would scroll the page itself and cause the active
  // heading to oscillate as scroll-driven highlighting fights the scroll.
  if (!container) return;

  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  const toc = activeLi.closest<HTMLElement>("[data-ps-toc]");
  const title = toc?.querySelector<HTMLElement>(".doc-toc-title") ?? null;
  const list = toc?.querySelector<HTMLElement>(".doc-toc-list, .toc-list, ul");
  const firstItem = list?.querySelector<HTMLElement>(".doc-toc-item, .toc-item") ?? null;

  const containerRect = container.getBoundingClientRect();
  const itemRect = activeLi.getBoundingClientRect();

  let target: number;

  // When the first item is active, anchor the scroll so the "On this page"
  // title is visible too — otherwise the title gets clipped above the top
  // of the scroll container.
  if (firstItem === activeLi && title) {
    const titleRect = title.getBoundingClientRect();
    target = container.scrollTop + (titleRect.top - containerRect.top) - 8;
  } else {
    // Bring the active item into view with a comfortable margin, but only
    // when it's actually outside the visible area of the TOC container.
    const margin = 24;
    const itemTop = itemRect.top - containerRect.top;
    const itemBottom = itemRect.bottom - containerRect.top;
    if (itemTop < margin) {
      target = container.scrollTop + itemTop - margin;
    } else if (itemBottom > container.clientHeight - margin) {
      target = container.scrollTop + itemBottom - (container.clientHeight - margin);
    } else {
      return;
    }
  }

  const max = container.scrollHeight - container.clientHeight;
  container.scrollTo({ top: Math.max(0, Math.min(max, target)), behavior });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initMobileTocNavigation(): void {
  const mobileToc = document.querySelector<HTMLDetailsElement>(".doc-toc-mobile");
  if (!mobileToc) return;

  const mobileLinks = mobileToc.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]');
  if (mobileLinks.length === 0) return;

  mobileLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const targetId = href?.slice(1);
      if (!href || !targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      mobileToc.open = false;
      link.blur();

      if (window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }

      window.requestAnimationFrame(() => {
        target.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      });
    });
  });
}

export function initTocHighlight(): void {
  initMobileTocNavigation();

  const tocLinks = document.querySelectorAll<HTMLAnchorElement>(
    "[data-ps-toc] .doc-toc-item a, [data-ps-toc] .toc-item a, .doc-aside .doc-toc-item a, .sidebar-right .toc-item a",
  );
  if (tocLinks.length === 0) return;

  const headingIds = Array.from(tocLinks)
    .map((a) => a.getAttribute("href")?.slice(1))
    .filter((id): id is string => !!id);

  const headings = headingIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  if (headings.length === 0) return;

  // Track which headings are currently visible
  const visibleIds = new Set<string>();
  let currentId = "";

  function updateActive() {
    const prevId = currentId;
    // Pick the first heading in document order that is visible
    currentId = "";
    for (const id of headingIds) {
      if (visibleIds.has(id)) {
        currentId = id;
        break;
      }
    }

    // When no TOC heading is in the viewport (e.g. scrolled into h4+ content
    // whose parent h3 left the screen), highlight the last TOC heading that
    // scrolled above the viewport top.
    if (!currentId) {
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top < 100) {
          currentId = headings[i].id;
          break;
        }
      }
    }
    // Update TOC active state
    tocLinks.forEach((link) => {
      const li = link.parentElement;
      if (li) {
        li.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
      }
    });
    // Scroll active TOC item into view when it changes
    if (currentId !== prevId) {
      // Keep the sticky side TOC aligned without dragging the document back to
      // the top when a link is clicked from the mobile accordion.
      const activeLi = getVisibleSideTocItem();
      if (activeLi) {
        scrollActiveTocItemIntoView(activeLi);
      }
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleIds.add(entry.target.id);
        } else {
          visibleIds.delete(entry.target.id);
        }
      }
      updateActive();
    },
    {
      rootMargin: "-80px 0px -40% 0px",
      threshold: 0,
    },
  );

  headings.forEach((h) => observer.observe(h));
}
