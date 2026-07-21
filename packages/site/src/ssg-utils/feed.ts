/**
 * RSS 2.0 feed generation for Pagesmith sites.
 *
 * Produces a standards-compliant RSS 2.0 document with RFC-822 dates,
 * absolute item/channel URLs derived from the site `origin` + `basePath`,
 * and channel metadata taken from the site config. Entries are filtered to
 * those with a publish date that parses to a valid `Date` (an absent or
 * unparseable `publishedDate` is dropped, never emitted as `Invalid Date`),
 * sorted newest-first, and capped at `limit` (default 50).
 *
 * The output shape mirrors the hand-rolled `writeRss()` postbuild step used
 * by content sites so an existing generator can be swapped for this export
 * with near-identical output.
 */

import { normalizeOrigin, withBasePath } from "../config.js";

export type FeedEntry = {
  /** Item title. */
  title: string;
  /**
   * Route path for the item. May be a bare route (`/blog/post`) or already
   * carry the base path — `withBasePath` is idempotent, so both resolve to
   * the same absolute URL.
   */
  path: string;
  /**
   * Publish date. Entries without one — or whose value does not parse to a
   * valid `Date` — are excluded from the feed.
   */
  publishedDate?: string | Date;
  /** Item summary. Falls back to the title when omitted. */
  description?: string;
  /** Tag names emitted as `<category>` elements. */
  tags?: string[];
};

export type FeedConfig = {
  /** Site origin, e.g. `https://example.com` (trailing slashes trimmed). */
  origin: string;
  /** Deployment base path, e.g. `/docs`. Default: none. */
  basePath?: string;
  /** Channel `<title>`. */
  title: string;
  /** Channel `<description>`. */
  description: string;
  /** Channel `<language>`, e.g. `en`. */
  language: string;
  /** Maximum number of items to include. Default: 50. */
  limit?: number;
  /**
   * Timestamp for `<lastBuildDate>`. Defaults to the current time; pass an
   * explicit `Date` for deterministic output (e.g. in tests).
   */
  buildDate?: Date;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toTime(date: string | Date): number {
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

/**
 * Generate an RSS 2.0 feed document from a list of entries and site config.
 *
 * @example
 * ```ts
 * import { generateFeed } from '@pagesmith/site/ssg-utils'
 *
 * const xml = generateFeed(posts, {
 *   origin: 'https://example.com',
 *   basePath: '/blog',
 *   title: 'Example',
 *   description: 'Latest posts',
 *   language: 'en',
 * })
 * writeFileSync('dist/rss.xml', xml)
 * ```
 */
export function generateFeed(entries: FeedEntry[], config: FeedConfig): string {
  const origin = normalizeOrigin(config.origin);
  const limit = config.limit ?? 50;
  const buildDate = config.buildDate ?? new Date();
  const channelLink = `${origin}${withBasePath(config.basePath, "/")}`;

  const items = entries
    .filter((entry) => entry.publishedDate != null && Number.isFinite(toTime(entry.publishedDate)))
    .sort((left, right) => toTime(right.publishedDate!) - toTime(left.publishedDate!))
    .slice(0, limit);

  const feedItems = items
    .map((entry) => {
      const url = `${origin}${withBasePath(config.basePath, entry.path)}`;
      const pubDate = new Date(entry.publishedDate!).toUTCString();
      const categories = (entry.tags ?? [])
        .map((tag) => `    <category>${escapeXml(tag)}</category>`)
        .join("\n");
      return [
        "  <item>",
        `    <title>${escapeXml(entry.title)}</title>`,
        `    <link>${escapeXml(url)}</link>`,
        `    <guid>${escapeXml(url)}</guid>`,
        `    <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `    <description>${escapeXml(entry.description ?? entry.title)}</description>`,
        categories,
        "  </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${escapeXml(config.title)}</title>\n  <link>${escapeXml(channelLink)}</link>\n  <description>${escapeXml(config.description)}</description>\n  <language>${escapeXml(config.language)}</language>\n  <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>\n${feedItems}\n</channel>\n</rss>\n`;
}
