/**
 * Path-to-slug conversion.
 *
 * Generalized from packages/core/src/content/collector.ts.
 */

import { extname, relative } from "path";

/**
 * Convert a content file path to a URL-friendly slug.
 *
 * Examples:
 *   content/posts/hello-world/README.md  ->  'hello-world'
 *   content/posts/hello-world/index.md   ->  'hello-world'
 *   content/posts/hello-world.md         ->  'hello-world'
 *   content/authors/john.json            ->  'john'
 *   content/posts/nested/deep/post.md    ->  'nested/deep/post'
 */
export function toSlug(filePath: string, directory: string): string {
  const ext = extname(filePath);
  let slug = relative(directory, filePath).replace(/\\/g, "/");

  // Remove file extension
  if (ext) {
    slug = slug.slice(0, -ext.length);
  }

  // Strip README / index suffixes
  if (slug === "README" || slug === "index") return "/";
  if (slug.endsWith("/README")) slug = slug.slice(0, -7);
  if (slug.endsWith("/index")) slug = slug.slice(0, -6);

  return slug;
}
