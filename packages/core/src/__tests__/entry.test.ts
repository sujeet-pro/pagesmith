import { describe, expect, it } from "vite-plus/test";
import { ContentEntry } from "../entry";

const EMPTY_MD_CONFIG = {};

describe("ContentEntry", () => {
  describe("properties", () => {
    it("exposes slug, collection, filePath, and data", () => {
      const entry = new ContentEntry(
        "test-slug",
        "posts",
        "/tmp/posts/test.md",
        { title: "Test", tags: ["a"] },
        "# Hello",
        EMPTY_MD_CONFIG,
      );

      expect(entry.slug).toBe("test-slug");
      expect(entry.collection).toBe("posts");
      expect(entry.filePath).toBe("/tmp/posts/test.md");
      expect(entry.data.title).toBe("Test");
      expect(entry.data.tags).toEqual(["a"]);
    });

    it("exposes rawContent for markdown entries", () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        {},
        "# Body content",
        EMPTY_MD_CONFIG,
      );

      expect(entry.rawContent).toBe("# Body content");
    });

    it("rawContent is undefined for non-markdown entries", () => {
      const entry = new ContentEntry(
        "test",
        "data",
        "/tmp/test.json",
        {},
        undefined,
        EMPTY_MD_CONFIG,
      );

      expect(entry.rawContent).toBeUndefined();
    });
  });

  describe("render", () => {
    it("renders markdown content to HTML", async () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        { title: "Test" },
        "# Hello World\n\nSome text here.",
        EMPTY_MD_CONFIG,
      );

      const result = await entry.render();

      expect(result.html).toContain("Hello World");
      expect(result.html).toContain("Some text here");
      expect(result.headings.length).toBe(1);
      expect(result.headings[0].text).toBe("Hello World");
      expect(result.headings[0].depth).toBe(1);
      expect(result.readTime).toBeGreaterThan(0);
    });

    it("caches render result after first call", async () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        {},
        "# Hello",
        EMPTY_MD_CONFIG,
      );

      const first = await entry.render();
      const second = await entry.render();

      expect(first).toBe(second);
    });

    it("re-renders when force option is true", async () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        {},
        "# Hello",
        EMPTY_MD_CONFIG,
      );

      const first = await entry.render();
      const forced = await entry.render({ force: true });

      expect(first).not.toBe(forced);
      expect(first.html).toBe(forced.html);
    });

    it("returns empty result for non-markdown entries", async () => {
      const entry = new ContentEntry(
        "test",
        "data",
        "/tmp/test.json",
        {},
        undefined,
        EMPTY_MD_CONFIG,
      );

      const result = await entry.render();

      expect(result.html).toBe("");
      expect(result.headings).toEqual([]);
      expect(result.readTime).toBe(0);
    });

    it("caches empty result for non-markdown entries", async () => {
      const entry = new ContentEntry(
        "test",
        "data",
        "/tmp/test.json",
        {},
        undefined,
        EMPTY_MD_CONFIG,
      );

      const first = await entry.render();
      const second = await entry.render();

      expect(first).toBe(second);
    });
  });

  describe("clearRenderCache", () => {
    it("clears the cached render result", async () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        {},
        "# Hello",
        EMPTY_MD_CONFIG,
      );

      const first = await entry.render();
      entry.clearRenderCache();
      const second = await entry.render();

      expect(first).not.toBe(second);
    });

    it("is a no-op when no render has been performed", () => {
      const entry = new ContentEntry(
        "test",
        "posts",
        "/tmp/test.md",
        {},
        "# Hello",
        EMPTY_MD_CONFIG,
      );

      expect(() => entry.clearRenderCache()).not.toThrow();
    });
  });

  describe("render with markdown features", () => {
    it("extracts multiple headings at different depths", async () => {
      const md = "# Title\n\n## Section A\n\n### Subsection\n\n## Section B";
      const entry = new ContentEntry("test", "posts", "/tmp/test.md", {}, md, EMPTY_MD_CONFIG);

      const result = await entry.render();

      expect(result.headings.length).toBe(4);
      expect(result.headings[0].depth).toBe(1);
      expect(result.headings[1].depth).toBe(2);
      expect(result.headings[2].depth).toBe(3);
      expect(result.headings[3].depth).toBe(2);
    });

    it("computes read time based on word count", async () => {
      const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(" ");
      const entry = new ContentEntry("test", "posts", "/tmp/test.md", {}, words, EMPTY_MD_CONFIG);

      const result = await entry.render();

      expect(result.readTime).toBeGreaterThanOrEqual(2);
    });
  });
});
