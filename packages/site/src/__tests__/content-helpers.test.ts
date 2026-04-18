import { describe, expect, it } from "vite-plus/test";
import {
  sortByManualOrder,
  sortByDate,
  buildBreadcrumbs,
  buildSidebarFromEntries,
  buildPrevNext,
} from "../content-helpers.js";

type Entry = { slug: string; title: string; date?: string; path: string };

const entries: Entry[] = [
  { slug: "gamma", title: "Gamma", date: "2026-01-01", path: "/gamma" },
  { slug: "alpha", title: "Alpha", date: "2026-03-01", path: "/alpha" },
  { slug: "beta", title: "Beta", date: "2026-02-01", path: "/beta" },
  { slug: "delta", title: "Delta", path: "/delta" },
];

describe("sortByManualOrder", () => {
  it("sorts by manual order with fallback to original position", () => {
    const result = sortByManualOrder(entries, ["beta", "alpha"], (e) => e.slug);
    expect(result.map((e) => e.slug)).toEqual(["beta", "alpha", "gamma", "delta"]);
  });

  it("sorts by manual order with title fallback", () => {
    const result = sortByManualOrder(
      entries,
      ["beta"],
      (e) => e.slug,
      (a, b) => a.title.localeCompare(b.title),
    );
    expect(result.map((e) => e.slug)).toEqual(["beta", "alpha", "delta", "gamma"]);
  });

  it("returns original order with empty manual list", () => {
    const result = sortByManualOrder(entries, [], (e) => e.slug);
    expect(result.map((e) => e.slug)).toEqual(["gamma", "alpha", "beta", "delta"]);
  });

  it("does not mutate the input array", () => {
    const original = [...entries];
    sortByManualOrder(entries, ["beta"], (e) => e.slug);
    expect(entries).toEqual(original);
  });
});

describe("sortByDate", () => {
  it("sorts newest first", () => {
    const result = sortByDate(entries, (e) => e.date);
    expect(result.map((e) => e.slug)).toEqual(["alpha", "beta", "gamma", "delta"]);
  });

  it("uses fallback for entries with same date", () => {
    const same = [
      { slug: "b", title: "B", date: "2026-01-01", path: "/b" },
      { slug: "a", title: "A", date: "2026-01-01", path: "/a" },
    ];
    const result = sortByDate(
      same,
      (e) => e.date,
      (a, b) => a.title.localeCompare(b.title),
    );
    expect(result.map((e) => e.slug)).toEqual(["a", "b"]);
  });

  it("puts entries without dates last", () => {
    const result = sortByDate(entries, (e) => e.date);
    expect(result[result.length - 1]!.slug).toBe("delta");
  });

  it("does not mutate the input array", () => {
    const original = [...entries];
    sortByDate(entries, (e) => e.date);
    expect(entries).toEqual(original);
  });
});

describe("buildBreadcrumbs", () => {
  it("builds breadcrumbs with basePath prefix", () => {
    const result = buildBreadcrumbs("/docs", [
      { label: "Home", path: "/" },
      { label: "Guide", path: "/guide" },
      { label: "Current Page" },
    ]);
    expect(result).toEqual([
      { label: "Home", path: "/docs" },
      { label: "Guide", path: "/docs/guide" },
      { label: "Current Page" },
    ]);
  });

  it("handles empty basePath", () => {
    const result = buildBreadcrumbs("", [{ label: "Home", path: "/" }, { label: "Page" }]);
    expect(result).toEqual([{ label: "Home", path: "/" }, { label: "Page" }]);
  });

  it("handles empty crumbs", () => {
    expect(buildBreadcrumbs("/docs", [])).toEqual([]);
  });
});

describe("buildSidebarFromEntries", () => {
  it("builds a sidebar section", () => {
    const result = buildSidebarFromEntries("Articles", [
      { title: "First", path: "/first" },
      { title: "Second", path: "/second" },
    ]);
    expect(result).toEqual([
      {
        title: "Articles",
        items: [
          { title: "First", path: "/first" },
          { title: "Second", path: "/second" },
        ],
      },
    ]);
  });

  it("prepends overview link when overviewPath is set", () => {
    const result = buildSidebarFromEntries("Projects", [{ title: "Foo", path: "/foo" }], {
      overviewPath: "/projects",
    });
    expect(result[0]!.items[0]).toEqual({ title: "Overview", path: "/projects" });
    expect(result[0]!.items[1]).toEqual({ title: "Foo", path: "/foo" });
  });

  it("handles empty entries", () => {
    const result = buildSidebarFromEntries("Empty", []);
    expect(result[0]!.items).toEqual([]);
  });
});

describe("buildPrevNext", () => {
  const items = [
    { title: "A", path: "/a" },
    { title: "B", path: "/b" },
    { title: "C", path: "/c" },
  ];

  it("returns prev and next for middle entry", () => {
    const result = buildPrevNext(
      items,
      1,
      (e) => e.title,
      (e) => e.path,
    );
    expect(result.prev).toEqual({ title: "A", path: "/a" });
    expect(result.next).toEqual({ title: "C", path: "/c" });
  });

  it("returns no prev for first entry", () => {
    const result = buildPrevNext(
      items,
      0,
      (e) => e.title,
      (e) => e.path,
    );
    expect(result.prev).toBeUndefined();
    expect(result.next).toEqual({ title: "B", path: "/b" });
  });

  it("returns no next for last entry", () => {
    const result = buildPrevNext(
      items,
      2,
      (e) => e.title,
      (e) => e.path,
    );
    expect(result.prev).toEqual({ title: "B", path: "/b" });
    expect(result.next).toBeUndefined();
  });

  it("returns no prev or next for single entry", () => {
    const result = buildPrevNext(
      [{ title: "Solo", path: "/solo" }],
      0,
      (e) => e.title,
      (e) => e.path,
    );
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });

  it("handles negative index", () => {
    const result = buildPrevNext(
      items,
      -1,
      (e) => e.title,
      (e) => e.path,
    );
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });
});
