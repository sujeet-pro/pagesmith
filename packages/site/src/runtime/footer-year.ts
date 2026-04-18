const FOOTER_YEAR_ID = "pagesmith-footer-year-end";

export function initFooterCopyrightYear(): void {
  const endYear = document.getElementById(FOOTER_YEAR_ID);
  if (!(endYear instanceof HTMLElement)) return;
  if (endYear.dataset.autoUpdate !== "true") return;

  const currentYear = new Date().getFullYear();
  const renderedYear = Number(endYear.dataset.renderedYear);
  if (!Number.isFinite(renderedYear) || currentYear === renderedYear) return;

  endYear.textContent = String(currentYear);
  endYear.dataset.renderedYear = String(currentYear);

  const range = endYear.closest<HTMLElement>("[data-current-year-range]");
  if (!range) return;

  const startYear = Number(endYear.dataset.startYear);
  const showRange = Number.isFinite(startYear) && currentYear !== startYear;
  const start = range.querySelector<HTMLElement>(".doc-footer-year-start");
  const separator = range.querySelector<HTMLElement>(".doc-footer-year-separator");

  if (start) {
    start.hidden = !showRange;
    if (showRange) {
      start.removeAttribute("aria-hidden");
    } else {
      start.setAttribute("aria-hidden", "true");
    }
  }

  if (separator) {
    separator.hidden = !showRange;
  }
}
