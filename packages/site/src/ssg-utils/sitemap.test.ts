import { describe, expect, it } from "vite-plus/test";
import { generateSitemap } from "./sitemap.js";

describe("generateSitemap", () => {
  it("wraps routes in a urlset with absolute locs", () => {
    const xml = generateSitemap(["", "/about", "/blog/hello"], {
      origin: "https://example.com",
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<url><loc>https://example.com</loc></url>");
    expect(xml).toContain("<url><loc>https://example.com/about</loc></url>");
    expect(xml).toContain("<url><loc>https://example.com/blog/hello</loc></url>");
    expect(xml.endsWith("</urlset>")).toBe(true);
  });

  it("prefixes the base path onto every route including home", () => {
    const xml = generateSitemap(["", "/guide"], {
      origin: "https://example.com",
      basePath: "/docs",
    });
    expect(xml).toContain("<url><loc>https://example.com/docs</loc></url>");
    expect(xml).toContain("<url><loc>https://example.com/docs/guide</loc></url>");
  });

  it('treats "/" as the home route', () => {
    const xml = generateSitemap(["/"], { origin: "https://example.com/", basePath: "/docs" });
    expect(xml).toContain("<url><loc>https://example.com/docs</loc></url>");
  });

  it("adds a leading slash to bare route paths", () => {
    const xml = generateSitemap(["about"], { origin: "https://example.com" });
    expect(xml).toContain("<url><loc>https://example.com/about</loc></url>");
  });

  it("escapes ampersands in route paths", () => {
    const xml = generateSitemap(["/a&b"], { origin: "https://example.com" });
    expect(xml).toContain("<loc>https://example.com/a&amp;b</loc>");
  });
});
