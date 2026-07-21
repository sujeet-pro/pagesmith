import { describe, expect, it } from "vite-plus/test";
import {
  buildArticleStructuredData,
  buildWebsiteStructuredData,
  serializeJsonLd,
} from "./structured-data.js";

describe("buildArticleStructuredData", () => {
  it("emits a full BlogPosting graph from resolved data", () => {
    const data = buildArticleStructuredData({
      type: "BlogPosting",
      headline: "Hello World",
      description: "A post",
      datePublished: "2024-01-01T00:00:00.000Z",
      dateModified: "2024-02-01T00:00:00.000Z",
      author: "Ada Lovelace",
      url: "https://example.com/blog/hello",
      image: "https://example.com/og.png",
    });

    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Hello World",
      description: "A post",
      url: "https://example.com/blog/hello",
      mainEntityOfPage: "https://example.com/blog/hello",
      datePublished: "2024-01-01T00:00:00.000Z",
      dateModified: "2024-02-01T00:00:00.000Z",
      author: { "@type": "Person", name: "Ada Lovelace" },
      image: "https://example.com/og.png",
    });
  });

  it("omits absent fields and falls back dateModified to datePublished", () => {
    const data = buildArticleStructuredData({
      type: "Article",
      headline: "Minimal",
      datePublished: "2024-01-01T00:00:00.000Z",
    });

    expect(data.dateModified).toBe("2024-01-01T00:00:00.000Z");
    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("author");
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("url");
  });
});

describe("buildWebsiteStructuredData", () => {
  it("emits a WebSite graph", () => {
    const data = buildWebsiteStructuredData({
      name: "Example",
      url: "https://example.com/",
      description: "A site",
    });
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Example",
      url: "https://example.com/",
      description: "A site",
    });
  });

  it("omits description when absent", () => {
    const data = buildWebsiteStructuredData({ name: "Example", url: "https://example.com/" });
    expect(data).not.toHaveProperty("description");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a nested </script> cannot terminate the tag", () => {
    const json = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c/script>");
    // Still valid JSON that round-trips to the original string.
    expect(JSON.parse(json)).toEqual({ headline: "</script><script>alert(1)</script>" });
  });
});
