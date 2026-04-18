export function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export function isExternalUrl(path: string): boolean {
  return (
    /^https?:\/\//i.test(path) ||
    path.startsWith("//") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  );
}

export function hasFileExtension(path: string): boolean {
  return /\/[^/?#]+\.[^/?#]+(?:[?#].*)?$/u.test(path);
}

export function withTrailingSlash(path: string): string {
  if (!path || path === "/") return "/";
  if (path.startsWith("#") || isExternalUrl(path) || hasFileExtension(path) || path.endsWith("/")) {
    return path;
  }
  return `${path}/`;
}

export function withoutTrailingSlash(path: string): string {
  if (!path || path === "/") return "/";
  if (path.startsWith("#") || isExternalUrl(path) || hasFileExtension(path)) return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Formats an internal path based on the trailing-slash preference.
 *
 * When `trailingSlash` is `true`, appends a slash (`/docs/guide/`).
 * When `false` (default), strips trailing slashes (`/docs/guide`).
 * External URLs, anchors, and paths with file extensions are returned as-is.
 */
export function formatPath(path: string, trailingSlash = false): string {
  return trailingSlash ? withTrailingSlash(path) : withoutTrailingSlash(path);
}

export function getExternalLinkProps(path: string) {
  return isExternalUrl(path) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
