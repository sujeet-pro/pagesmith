import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { createLinkValidator, type LinkValidatorOptions } from "../link-validator";
import type { ValidationIssue } from "../schema-validator";

function mdast(raw: string): Root {
  return unified().use(remarkParse).parse(raw) as Root;
}

const sandboxes: string[] = [];
function sandbox(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "pagesmith-lv-"));
  sandboxes.push(root);
  for (const [relPath, body] of Object.entries(files)) {
    const target = join(root, relPath);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, body);
  }
  return root;
}

afterAll(() => {
  // best-effort cleanup; mkdtemp files are small
});

async function runOnFile(
  opts: LinkValidatorOptions,
  filePath: string,
  raw: string,
): Promise<ValidationIssue[]> {
  const v = createLinkValidator(opts);
  const issues = await v.validate({
    filePath,
    slug: "/post",
    collection: "docs",
    rawContent: raw,
    data: {},
    mdast: mdast(raw),
  });
  return issues;
}

describe("linkValidator - baseline behavior", () => {
  it("accepts a valid relative link to an existing README", async () => {
    const root = sandbox({
      "src/guide/a/README.md": "# A",
      "src/guide/b/README.md": "# B\n\n[link to A](../a/README.md)",
    });
    const issues = await runOnFile(
      { rootDir: join(root, "src") },
      join(root, "src/guide/b/README.md"),
      "[link to A](../a/README.md)",
    );
    expect(issues).toEqual([]);
  });

  it("flags an internal link to a missing target", async () => {
    const root = sandbox({ "src/README.md": "# Home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src") },
      join(root, "src/README.md"),
      "[bad](./does-not-exist.md)",
    );
    expect(issues.some((i) => i.message.includes("Broken internal link"))).toBe(true);
  });

  it("skips URLs that match skipPatterns (string prefix)", async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent", skipPatterns: ["/api/"] },
      "/nonexistent/README.md",
      "[api](/api/users)",
    );
    expect(issues).toEqual([]);
  });

  it("skips URLs that match skipPatterns (glob)", async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent", skipPatterns: ["https://example.com/*"] },
      "/nonexistent/README.md",
      "[ex](https://example.com/whatever)",
    );
    expect(issues).toEqual([]);
  });

  it("warns on a malformed external URL", async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent" },
      "/nonexistent/README.md",
      "[bad](http://)",
    );
    expect(issues.some((i) => i.message.includes("Malformed external URL"))).toBe(true);
  });
});

describe("linkValidator - requireCanonicalInternalLinks", () => {
  const base = "requireCanonicalInternalLinks true";

  it(`${base} accepts ./foo.md, ./foo/README.md, ../sibling/index.md`, async () => {
    const root = sandbox({
      "src/a/README.md": "# A",
      "src/b/README.md": "# B",
      "src/b/sibling/index.md": "# Sibling",
      "src/b/foo.md": "# Foo",
    });
    const raw = ["[a](../a/README.md)", "[foo](./foo.md)", "[sib](./sibling/index.md)"].join(
      "\n\n",
    );
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/b/README.md"),
      raw,
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} rejects absolute /guide/foo`, async () => {
    const root = sandbox({ "src/guide/a/README.md": "# A", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[a](/guide/a)",
    );
    expect(issues.some((i) => i.message.includes("Non-canonical internal link"))).toBe(true);
  });

  it(`${base} rejects bare ./foo`, async () => {
    const root = sandbox({ "src/foo/README.md": "# Foo", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[foo](./foo)",
    );
    expect(issues.some((i) => i.message.includes("Non-canonical"))).toBe(true);
  });

  it(`${base} rejects ./foo/`, async () => {
    const root = sandbox({ "src/foo/README.md": "# Foo", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[foo](./foo/)",
    );
    expect(issues.some((i) => i.message.includes("Non-canonical"))).toBe(true);
  });

  it(`${base} rejects ./foo/README (no extension)`, async () => {
    const root = sandbox({ "src/foo/README.md": "# Foo", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[foo](./foo/README)",
    );
    expect(issues.some((i) => i.message.includes("Non-canonical"))).toBe(true);
  });

  it(`${base} accepts canonical form with #anchor`, async () => {
    const root = sandbox({ "src/a/README.md": "# A", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[a](./a/README.md#section)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} accepts canonical form with ?query`, async () => {
    const root = sandbox({ "src/a/README.md": "# A", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[a](./a/README.md?q=1)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} exempts #fragment-only links`, async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent", requireCanonicalInternalLinks: true },
      "/nonexistent/README.md",
      "[self](#section)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} exempts external URLs`, async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent", requireCanonicalInternalLinks: true },
      "/nonexistent/README.md",
      "[ext](https://example.com)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} exempts mailto: and tel: schemes`, async () => {
    const issues = await runOnFile(
      { rootDir: "/nonexistent", requireCanonicalInternalLinks: true },
      "/nonexistent/README.md",
      "[mail](mailto:hi@example.com) and [phone](tel:+15555550123)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} exempts asset links under additionalRoots`, async () => {
    const root = sandbox({ "public/file.pdf": "%PDF" });
    const issues = await runOnFile(
      {
        rootDir: join(root, "src"),
        requireCanonicalInternalLinks: true,
        additionalRoots: [{ prefix: "/assets", dir: join(root, "public") }],
      },
      "/nonexistent/README.md",
      "[pdf](/assets/file.pdf)",
    );
    // /assets/* must be treated as an exempt asset URL, not a page link.
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} exempts images (kind=image) even when URL is non-canonical`, async () => {
    const root = sandbox({ "src/img.svg": "<svg/>", "src/README.md": "# home" });
    const issues = await runOnFile(
      {
        rootDir: join(root, "src"),
        requireCanonicalInternalLinks: true,
        requireThemeVariantPairs: false,
      },
      join(root, "src/README.md"),
      "![logo](./img.svg)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });

  it(`${base} off by default (additive feature)`, async () => {
    const root = sandbox({ "src/guide/a/README.md": "# A", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src") },
      join(root, "src/README.md"),
      "[a](/guide/a)",
    );
    expect(issues.filter((i) => i.message.includes("Non-canonical"))).toEqual([]);
  });
});

describe("linkValidator - interoperability with other rules", () => {
  it("still enforces alt text when requireCanonicalInternalLinks is on", async () => {
    const issues = await runOnFile(
      {
        rootDir: "/nonexistent",
        requireCanonicalInternalLinks: true,
        requireAltText: true,
        requireThemeVariantPairs: false,
      },
      "/nonexistent/README.md",
      "![](./img.png)",
    );
    expect(issues.some((i) => i.message.includes("missing alt text"))).toBe(true);
  });

  it("still flags empty link text when requireCanonicalInternalLinks is on", async () => {
    const root = sandbox({ "src/a/README.md": "# A", "src/README.md": "# home" });
    const issues = await runOnFile(
      { rootDir: join(root, "src"), requireCanonicalInternalLinks: true },
      join(root, "src/README.md"),
      "[   ](./a/README.md)",
    );
    expect(
      issues.some(
        (i) => (i.field ?? "").includes("links") && i.message.includes("no visible text"),
      ),
    ).toBe(true);
  });

  it("flags raw <img> tag even when canonical rule is on", async () => {
    const issues = await runOnFile(
      {
        rootDir: "/nonexistent",
        requireCanonicalInternalLinks: true,
        forbidHtmlImgTag: true,
      },
      "/nonexistent/README.md",
      '<img src="x.png" alt="x">',
    );
    expect(issues.some((i) => i.message.includes("Raw <img>"))).toBe(true);
  });
});
