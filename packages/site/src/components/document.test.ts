import { describe, expect, it } from "vite-plus/test";
import { SiteDocument } from "./document.js";
import type { SiteDocumentData } from "./types.js";

const baseSite: SiteDocumentData = {
  origin: "https://example.com",
  basePath: "",
  name: "Example",
  title: "Example",
  description: "A site",
};

function render(props: Parameters<typeof SiteDocument>[0]): string {
  return SiteDocument(props).value;
}

function extractJsonLd(html: string): Record<string, unknown> | undefined {
  const match = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  return match ? (JSON.parse(match[1]!) as Record<string, unknown>) : undefined;
}

describe("SiteDocument JSON-LD", () => {
  it("emits Article JSON-LD for article pages built from resolved meta", () => {
    const html = render({
      title: "My Post",
      description: "Post summary",
      url: "/blog/my-post",
      socialImage: "/og.png",
      site: { ...baseSite, maintainer: { name: "Ada" } },
      meta: {
        ogType: "article",
        publishedTime: "2024-01-01T00:00:00.000Z",
        modifiedTime: "2024-02-01T00:00:00.000Z",
      },
    });

    const jsonLd = extractJsonLd(html);
    expect(jsonLd).toMatchObject({
      "@type": "Article",
      headline: "My Post",
      description: "Post summary",
      url: "https://example.com/blog/my-post",
      datePublished: "2024-01-01T00:00:00.000Z",
      dateModified: "2024-02-01T00:00:00.000Z",
      author: { "@type": "Person", name: "Ada" },
      image: "https://example.com/og.png",
    });
  });

  it("honors meta.articleType for the schema.org @type", () => {
    const html = render({
      title: "My Post",
      url: "/blog/my-post",
      site: baseSite,
      meta: { ogType: "article", articleType: "BlogPosting" },
    });
    expect(extractJsonLd(html)).toMatchObject({ "@type": "BlogPosting" });
  });

  it("emits WebSite JSON-LD on the home page", () => {
    const html = render({
      title: "Example",
      description: "A site",
      url: "/",
      site: baseSite,
      isHome: true,
    });
    expect(extractJsonLd(html)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Example",
      url: "https://example.com/",
      description: "A site",
    });
  });

  it("omits JSON-LD for non-article, non-home pages", () => {
    const html = render({ title: "About", url: "/about", site: baseSite });
    expect(html).not.toContain("application/ld+json");
  });

  it("respects the seo.jsonLd off-switch", () => {
    const html = render({
      title: "My Post",
      url: "/blog/my-post",
      site: { ...baseSite, seo: { jsonLd: false } },
      meta: { ogType: "article" },
    });
    expect(html).not.toContain("application/ld+json");
  });
});

describe("SiteDocument social image URL resolution", () => {
  function ogImageFrom(html: string): string | undefined {
    return html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  }
  function twitterImageFrom(html: string): string | undefined {
    return html.match(/<meta name="twitter:image" content="([^"]*)"/)?.[1];
  }

  it("prefixes a root-relative image with the origin", () => {
    const html = render({ title: "T", url: "/p", socialImage: "/og.png", site: baseSite });
    expect(ogImageFrom(html)).toBe("https://example.com/og.png");
    expect(twitterImageFrom(html)).toBe("https://example.com/og.png");
  });

  it("leaves an absolute http(s) image untouched", () => {
    const html = render({
      title: "T",
      url: "/p",
      socialImage: "https://cdn.example.net/og.png",
      site: baseSite,
    });
    expect(ogImageFrom(html)).toBe("https://cdn.example.net/og.png");
    expect(twitterImageFrom(html)).toBe("https://cdn.example.net/og.png");
  });

  it("leaves a protocol-relative //host image untouched (no origin prepended)", () => {
    const html = render({
      title: "T",
      url: "/p",
      socialImage: "//cdn.example.net/og.png",
      site: baseSite,
    });
    expect(ogImageFrom(html)).toBe("//cdn.example.net/og.png");
    expect(twitterImageFrom(html)).toBe("//cdn.example.net/og.png");
  });
});
