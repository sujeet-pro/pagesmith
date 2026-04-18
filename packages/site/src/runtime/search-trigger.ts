const MOBILE_TRIGGER_MEDIA_QUERY = "(max-width: 640px)";

function syncTriggerMode(isCompact: boolean): void {
  document
    .querySelectorAll<HTMLElement>("pagefind-modal-trigger.doc-search-trigger")
    .forEach((trigger) => {
      if (isCompact) {
        trigger.setAttribute("compact", "");
        trigger.setAttribute("hide-shortcut", "");
      } else {
        trigger.removeAttribute("compact");
        trigger.removeAttribute("hide-shortcut");
      }
    });
}

export function initSearchTriggerDensity(): void {
  if (typeof window.matchMedia !== "function") return;

  const mediaQuery = window.matchMedia(MOBILE_TRIGGER_MEDIA_QUERY);
  const sync = () => syncTriggerMode(mediaQuery.matches);

  sync();

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", sync);
  } else {
    mediaQuery.addListener(sync);
  }
}
