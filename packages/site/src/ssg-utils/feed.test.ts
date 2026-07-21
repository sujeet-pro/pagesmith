import { describe, expect, it } from "vite-plus/test";
import { generateFeed, type FeedEntry } from "./feed.js";

const config = {
  origin: "https://example.com",
  basePath: "/blog",
  title: "Example",
  description: "Latest posts",
  language: "en",
  buildDate: new Date("2024-03-01T00:00:00.000Z"),
};

const entries: FeedEntry[] = [
  {
    title: "Older",
    path: "/blog/older",
    publishedDate: "2024-01-01T00:00:00.000Z",
    description: "Old post",
    tags: ["ts"],
  },
  {
    title: "Newer",
    path: "/blog/newer",
    publishedDate: "2024-02-01T00:00:00.000Z",
  },
  { title: "No date", path: "/blog/skip" },
];

describe("generateFeed", () => {
  it("produces a valid RSS 2.0 channel with config metadata", () => {
    const xml = generateFeed(entries, config);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">')).toBe(
      true,
    );
    expect(xml).toContain("<title>Example</title>");
    expect(xml).toContain("<link>https://example.com/blog</link>");
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("<lastBuildDate>Fri, 01 Mar 2024 00:00:00 GMT</lastBuildDate>");
    expect(xml.endsWith("</channel>\n</rss>\n")).toBe(true);
  });

  it("sorts newest-first and drops entries without a publish date", () => {
    const xml = generateFeed(entries, config);
    expect(xml.indexOf("Newer")).toBeLessThan(xml.indexOf("Older"));
    expect(xml).not.toContain("No date");
  });

  it("drops entries whose publishedDate does not parse to a valid Date", () => {
    const withBadDate: FeedEntry[] = [
      ...entries,
      { title: "Unparseable", path: "/blog/bad", publishedDate: "not-a-date" },
      { title: "AlsoBad", path: "/blog/bad2", publishedDate: new Date("nope") },
    ];
    const xml = generateFeed(withBadDate, config);
    expect(xml).not.toContain("Unparseable");
    expect(xml).not.toContain("AlsoBad");
    // Never emit an "Invalid Date" pubDate for a dropped entry.
    expect(xml).not.toContain("Invalid Date");
  });

  it("emits absolute RFC-822 item URLs and dates", () => {
    const xml = generateFeed(entries, config);
    expect(xml).toContain("<link>https://example.com/blog/newer</link>");
    expect(xml).toContain("<guid>https://example.com/blog/newer</guid>");
    expect(xml).toContain("<pubDate>Thu, 01 Feb 2024 00:00:00 GMT</pubDate>");
  });

  it("does not double-apply basePath when entry paths already carry it", () => {
    const xml = generateFeed([entries[0]!], config);
    expect(xml).toContain("<link>https://example.com/blog/older</link>");
    expect(xml).not.toContain("/blog/blog/");
  });

  it("falls back description to title and emits categories from tags", () => {
    const xml = generateFeed(entries, config);
    expect(xml).toContain("<description>Newer</description>");
    expect(xml).toContain("<category>ts</category>");
  });

  it("caps the feed at the configured limit", () => {
    const many: FeedEntry[] = Array.from({ length: 5 }, (_, i) => ({
      title: `Post ${i}`,
      path: `/blog/post-${i}`,
      publishedDate: `2024-01-0${i + 1}T00:00:00.000Z`,
    }));
    const xml = generateFeed(many, { ...config, limit: 2 });
    expect((xml.match(/<item>/g) ?? []).length).toBe(2);
  });

  it("escapes XML-special characters in titles", () => {
    const xml = generateFeed(
      [{ title: "A & B <c>", path: "/blog/x", publishedDate: "2024-01-01T00:00:00.000Z" }],
      config,
    );
    expect(xml).toContain("<title>A &amp; B &lt;c&gt;</title>");
  });
});
