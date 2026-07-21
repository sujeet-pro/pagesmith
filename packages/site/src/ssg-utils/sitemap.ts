/**
 * sitemap.xml generation for Pagesmith sites.
 *
 * Builds a `urlset` document from a list of route paths. Each route is joined
 * onto the site `origin` + `basePath` to form an absolute `<loc>`. The home
 * route is expressed as an empty string (or `"/"`), which maps to the base
 * URL itself.
 *
 * Callers are responsible for excluding non-indexable routes before calling
 * (draft pages, redirect stubs, etc.) so this stays a pure serializer.
 */

import { normalizeBasePath, normalizeOrigin } from "../config.js";

export type SitemapConfig = {
  /** Site origin, e.g. `https://example.com` (trailing slashes trimmed). */
  origin: string;
  /** Deployment base path, e.g. `/docs`. Default: none. */
  basePath?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a sitemap.xml document.
 *
 * @param routes Route paths relative to the base URL. Use `""` (or `"/"`)
 *   for the home page. Paths are prefixed with a leading slash when missing.
 * @param config Site origin and base path.
 *
 * @example
 * ```ts
 * import { generateSitemap } from '@pagesmith/site/ssg-utils'
 *
 * const xml = generateSitemap(['', '/about', '/blog/hello'], {
 *   origin: 'https://example.com',
 *   basePath: '/docs',
 * })
 * ```
 */
export function generateSitemap(routes: string[], config: SitemapConfig): string {
  const base = `${normalizeOrigin(config.origin)}${normalizeBasePath(config.basePath)}`;

  const urls = routes.map((route) => {
    const suffix = route === "" || route === "/" ? "" : route.startsWith("/") ? route : `/${route}`;
    return `  <url><loc>${escapeXml(`${base}${suffix}`)}</loc></url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
