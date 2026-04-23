/**
 * Inline NPM badge SVG generator.
 *
 * Renders a shields.io-style "npm | <version>" badge as a self-contained SVG
 * with explicit `width`/`height` and a `viewBox`, so the home-page packages
 * grid never reflows after the badge paints. This is the no-CLS contract:
 * dimensions are computed at build time, the SVG is inlined into the page
 * (no extra request, no late-loading external resource), and the surrounding
 * card reserves exactly the right space.
 *
 * Width is computed from a conservative monospace-character estimate so the
 * box is always wide enough for the rendered text — there is no JS-side
 * measurement and no font fallback to worry about.
 */

const BADGE_HEIGHT = 20;
const LABEL_TEXT = "npm";
/** Fixed left segment width — fits "npm" with comfortable padding in DejaVu/Verdana 11px. */
const LABEL_WIDTH = 38;
/** Per-character width estimate for Verdana/DejaVu Sans 11px. Slightly generous to avoid glyph clipping. */
const VERSION_CHAR_WIDTH = 7;
const VERSION_HORIZONTAL_PADDING = 12;
/** Minimum value-segment width so even very short versions stay readable. */
const VERSION_MIN_WIDTH = 44;

const LABEL_BG = "#555";
const VALUE_BG = "#4c1";

/** Escape `"`, `<`, `>`, `&` for safe inclusion as SVG text content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a per-badge ID suffix derived from the package name + version so
 * multiple inlined badges on the same page each get unique `<linearGradient>`
 * and `<clipPath>` IDs (duplicate IDs are invalid HTML and can cause one
 * badge's gradient/clip to bleed into another).
 */
function buildIdSuffix(packageName: string, version: string): string {
  const raw = `${packageName}-${version}`;
  // Restrict to a CSS/HTML-id-safe character set; collapse anything else to `-`.
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type NpmBadge = {
  /** Self-contained `<svg>` markup with explicit width/height. */
  svg: string;
  width: number;
  height: number;
  /** Convenience link to the package on npmjs.com. */
  href: string;
};

/**
 * Build an inline NPM badge SVG for a published package.
 *
 * Both arguments must be non-empty — call sites that have not resolved a
 * version yet should skip rendering instead of passing an empty string.
 */
export function renderNpmBadge(packageName: string, version: string): NpmBadge {
  const safeVersion = version.trim();
  const versionWidth = Math.max(
    VERSION_MIN_WIDTH,
    safeVersion.length * VERSION_CHAR_WIDTH + VERSION_HORIZONTAL_PADDING,
  );
  const totalWidth = LABEL_WIDTH + versionWidth;
  const labelTextX = LABEL_WIDTH / 2;
  const valueTextX = LABEL_WIDTH + versionWidth / 2;
  const accessibleLabel = `npm package ${packageName} version ${safeVersion}`;
  const idSuffix = buildIdSuffix(packageName, safeVersion);
  const gradientId = `ps-npm-badge-gradient-${idSuffix}`;
  const clipId = `ps-npm-badge-clip-${idSuffix}`;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${BADGE_HEIGHT}" viewBox="0 0 ${totalWidth} ${BADGE_HEIGHT}" role="img" aria-label="${escapeXml(accessibleLabel)}" class="ps-npm-badge">`,
    `<title>${escapeXml(accessibleLabel)}</title>`,
    `<linearGradient id="${gradientId}" x2="0" y2="100%">`,
    `<stop offset="0" stop-color="#bbb" stop-opacity=".1"/>`,
    `<stop offset="1" stop-opacity=".1"/>`,
    `</linearGradient>`,
    `<clipPath id="${clipId}"><rect width="${totalWidth}" height="${BADGE_HEIGHT}" rx="3" fill="#fff"/></clipPath>`,
    `<g clip-path="url(#${clipId})">`,
    `<rect width="${LABEL_WIDTH}" height="${BADGE_HEIGHT}" fill="${LABEL_BG}"/>`,
    `<rect x="${LABEL_WIDTH}" width="${versionWidth}" height="${BADGE_HEIGHT}" fill="${VALUE_BG}"/>`,
    `<rect width="${totalWidth}" height="${BADGE_HEIGHT}" fill="url(#${gradientId})"/>`,
    `</g>`,
    `<g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">`,
    `<text x="${labelTextX}" y="14" fill="#010101" fill-opacity=".3">${LABEL_TEXT}</text>`,
    `<text x="${labelTextX}" y="13">${LABEL_TEXT}</text>`,
    `<text x="${valueTextX}" y="14" fill="#010101" fill-opacity=".3">${escapeXml(safeVersion)}</text>`,
    `<text x="${valueTextX}" y="13">${escapeXml(safeVersion)}</text>`,
    `</g>`,
    `</svg>`,
  ].join("");

  return {
    svg,
    width: totalWidth,
    height: BADGE_HEIGHT,
    href: `https://www.npmjs.com/package/${packageName}`,
  };
}
