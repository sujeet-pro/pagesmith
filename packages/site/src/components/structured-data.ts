/**
 * Schema.org JSON-LD builders for `SiteDocument`.
 *
 * These produce plain objects that are serialized into
 * `<script type="application/ld+json">` blocks. All inputs are already
 * resolved (absolute URLs, absolute image paths) by the caller so the
 * builders stay pure and framework-agnostic.
 */

/** Schema.org type used for content pages (`ogType === 'article'`). */
export type ArticleSchemaType = "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";

export type ArticleStructuredDataInput = {
  /** Schema.org `@type` — defaults to `"Article"` at the call site. */
  type: ArticleSchemaType;
  /** Article title → `headline`. */
  headline: string;
  /** Short summary → `description`. */
  description?: string;
  /** ISO 8601 publish date → `datePublished`. */
  datePublished?: string;
  /** ISO 8601 modified date → `dateModified` (falls back to `datePublished`). */
  dateModified?: string;
  /** Author display name → `author` (`Person`). */
  author?: string;
  /** Canonical absolute URL → `url` + `mainEntityOfPage`. */
  url?: string;
  /** Absolute social image URL → `image`. */
  image?: string;
};

export type WebsiteStructuredDataInput = {
  /** Site name → `name`. */
  name: string;
  /** Absolute home URL → `url`. */
  url: string;
  /** Site description → `description`. */
  description?: string;
};

/**
 * Build an `Article`/`BlogPosting` (or other article subtype) JSON-LD object
 * from already-resolved OG/meta data. Fields that are absent are omitted
 * rather than emitted as `null` so the structured data stays valid.
 */
export function buildArticleStructuredData(
  input: ArticleStructuredDataInput,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": input.type,
    headline: input.headline,
  };

  if (input.description) data.description = input.description;
  if (input.url) {
    data.url = input.url;
    data.mainEntityOfPage = input.url;
  }
  if (input.datePublished) data.datePublished = input.datePublished;
  const modified = input.dateModified ?? input.datePublished;
  if (modified) data.dateModified = modified;
  if (input.author) data.author = { "@type": "Person", name: input.author };
  if (input.image) data.image = input.image;

  return data;
}

/**
 * Build a `WebSite` JSON-LD object for the home page.
 */
export function buildWebsiteStructuredData(
  input: WebsiteStructuredDataInput,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
  };
  if (input.description) data.description = input.description;
  return data;
}

/**
 * Serialize a JSON-LD object for safe embedding inside an inline
 * `<script>` element. Escapes `<` as `<` so a stray `</script>` (or
 * `<!--`) inside string values cannot terminate the script element or open
 * an HTML comment. The escaped sequence is still valid JSON and parses back
 * to the original string.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
