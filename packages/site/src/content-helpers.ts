import { normalizeBasePath, withBasePath } from "./config.js";
import type {
  SiteBreadcrumb,
  SitePageLink,
  SiteSidebarItem,
  SiteSidebarSection,
} from "./components/types.js";

/**
 * Sort entries by manual order, with unordered entries falling back to a comparator.
 *
 * Items that appear in `orderedSlugs` are placed first (in that order).
 * Remaining items are appended, sorted by `fallbackCompare` (default: title alphabetical).
 */
export function sortByManualOrder<T>(
  entries: T[],
  orderedSlugs: string[],
  getSlug: (entry: T) => string,
  fallbackCompare?: (a: T, b: T) => number,
): T[] {
  const order = new Map(orderedSlugs.map((slug, index) => [slug, index]));
  const defaultCompare = fallbackCompare ?? (() => 0);

  return [...entries].sort((a, b) => {
    const aPos = order.get(getSlug(a));
    const bPos = order.get(getSlug(b));

    if (aPos != null && bPos != null) return aPos - bPos;
    if (aPos != null) return -1;
    if (bPos != null) return 1;
    return defaultCompare(a, b);
  });
}

/**
 * Sort entries by date (newest first), falling back to a comparator for ties.
 */
export function sortByDate<T>(
  entries: T[],
  getDate: (entry: T) => string | Date | undefined,
  fallbackCompare?: (a: T, b: T) => number,
): T[] {
  const defaultCompare = fallbackCompare ?? (() => 0);

  return [...entries].sort((a, b) => {
    const aDate = toTimestamp(getDate(a));
    const bDate = toTimestamp(getDate(b));
    const delta = bDate - aDate;
    if (delta !== 0) return delta;
    return defaultCompare(a, b);
  });
}

function toTimestamp(value: string | Date | undefined): number {
  if (!value) return 0;
  const ts = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Build a breadcrumb trail with basePath-prefixed paths.
 *
 * Each crumb with a `path` gets it prefixed with `basePath`.
 * The last crumb typically has no path (it represents the current page).
 */
export function buildBreadcrumbs(
  basePath: string,
  crumbs: Array<{ label: string; path?: string }>,
): SiteBreadcrumb[] {
  const normalized = normalizeBasePath(basePath);
  return crumbs.map((crumb) => ({
    label: crumb.label,
    ...(crumb.path != null ? { path: withBasePath(normalized, crumb.path) } : {}),
  }));
}

/**
 * Build sidebar sections from an array of entries.
 */
export function buildSidebarFromEntries(
  title: string,
  entries: Array<{ title: string; path: string }>,
  options?: { overviewPath?: string },
): SiteSidebarSection[] {
  const items: SiteSidebarItem[] = [];

  if (options?.overviewPath) {
    items.push({ title: "Overview", path: options.overviewPath });
  }

  for (const entry of entries) {
    items.push({ title: entry.title, path: entry.path });
  }

  return [{ title, items }];
}

/**
 * Build prev/next navigation links from an ordered list of entries.
 *
 * Returns the adjacent entries relative to `currentIndex`.
 */
export function buildPrevNext<T>(
  entries: T[],
  currentIndex: number,
  getTitle: (entry: T) => string,
  getPath: (entry: T) => string,
): { prev?: SitePageLink; next?: SitePageLink } {
  const prev =
    currentIndex > 0
      ? { title: getTitle(entries[currentIndex - 1]!), path: getPath(entries[currentIndex - 1]!) }
      : undefined;
  const next =
    currentIndex >= 0 && currentIndex < entries.length - 1
      ? { title: getTitle(entries[currentIndex + 1]!), path: getPath(entries[currentIndex + 1]!) }
      : undefined;

  return { prev, next };
}
