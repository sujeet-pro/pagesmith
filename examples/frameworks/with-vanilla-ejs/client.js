// Client bundle: theme + content runtime (prose/code behaviors). Keep this
// thin — layout already ships inline JS for TOC/theme/sidebar; this file only
// pulls hashed bundle URLs from the SSR layout and adjusts Pagefind triggers
// for small viewports.

import "./src/theme.css";
import "@pagesmith/site/runtime/content";

if (typeof window.matchMedia === "function") {
  const mediaQuery = window.matchMedia("(max-width: 640px)");
  const sync = () => {
    document.querySelectorAll("pagefind-modal-trigger.doc-search-trigger").forEach((trigger) => {
      if (mediaQuery.matches) {
        trigger.setAttribute("compact", "");
        trigger.setAttribute("hide-shortcut", "");
      } else {
        trigger.removeAttribute("compact");
        trigger.removeAttribute("hide-shortcut");
      }
    });
  };

  sync();

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", sync);
  } else {
    mediaQuery.addListener(sync);
  }
}
