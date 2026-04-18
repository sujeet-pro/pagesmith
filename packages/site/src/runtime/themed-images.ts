/**
 * Theme-aware image runtime.
 *
 * Handles explicit color-scheme overrides (via class on <html>) for
 * `.ps-figure-themed` images.
 *
 * In auto mode (no forced class), `<picture>` media queries handle
 * light/dark selection natively — zero JS cost. This runtime only
 * intervenes when the scheme is explicitly forced to 'light' or 'dark'
 * via a CSS class, toggling `media` attributes on `<source>` elements
 * stamped with `data-scheme="light|dark"`.
 *
 * No runtime state is held — the source of truth lives in the HTML
 * via `data-scheme` attributes. The `<img>` src is never modified;
 * it serves as a static fallback for browsers without `<picture>`.
 *
 * Detection uses a MutationObserver on the `class` attribute of <html>
 * with a cached-scheme guard, so unrelated class changes (text-size,
 * theme palette) are a single classList check with no DOM mutations.
 */

const THEMED_SELECTOR = ".ps-figure-themed";
const SCHEME_DARK = "color-scheme-dark";
const SCHEME_LIGHT = "color-scheme-light";
const DARK_MEDIA = "(prefers-color-scheme: dark)";
const BLOCKED_MEDIA = "not all";

let lastScheme: "light" | "dark" | "auto" | undefined;
let teardown: (() => void) | undefined;

function getEffectiveScheme(): "light" | "dark" | "auto" {
  const cl = document.documentElement.classList;
  if (cl.contains(SCHEME_DARK)) return "dark";
  if (cl.contains(SCHEME_LIGHT)) return "light";
  return "auto";
}

function applyScheme(figure: HTMLElement, scheme: "light" | "dark" | "auto"): void {
  for (const source of figure.querySelectorAll<HTMLElement>("source[data-scheme]")) {
    const sourceScheme = source.dataset.scheme;

    if (scheme === "auto") {
      // Restore native media-query behavior
      if (sourceScheme === "dark") {
        source.setAttribute("media", DARK_MEDIA);
      } else {
        source.removeAttribute("media");
      }
    } else if (sourceScheme === scheme) {
      // Matching scheme: remove media so it matches unconditionally
      source.removeAttribute("media");
    } else {
      // Non-matching scheme: block with "not all"
      source.setAttribute("media", BLOCKED_MEDIA);
    }
  }
}

function updateAllThemedImages(): void {
  const scheme = getEffectiveScheme();
  if (scheme === lastScheme) return;
  lastScheme = scheme;

  for (const figure of document.querySelectorAll<HTMLElement>(THEMED_SELECTOR)) {
    applyScheme(figure, scheme);
  }
}

export function initThemedImages(): void {
  if (typeof document === "undefined") return;

  teardown?.();
  lastScheme = undefined;

  updateAllThemedImages();

  // Only fires on class attribute changes — not data attributes, style, etc.
  // The lastScheme guard ensures unrelated class changes (text-size, theme
  // palette) never cause DOM mutations — just a single classList check.
  const observer = new MutationObserver(() => updateAllThemedImages());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  teardown = () => {
    observer.disconnect();
    teardown = undefined;
  };
}
