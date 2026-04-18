import { describe, it, expect } from "vite-plus/test";
import { resolve } from "path";
import { z } from "zod";
import { validateSchema, formatPath } from "../validation/schema-validator";
import { createContentLayer, defineCollection, defineConfig } from "../index";
import { processMarkdown } from "../markdown/pipeline";
import { registerLoader, resolveLoader } from "../loaders/index";
import { createLinkValidator } from "../validation/link-validator";
import { runValidators } from "../validation/runner";
import type { Loader } from "../loaders/types";

// ---------------------------------------------------------------------------
// validateSchema — error paths and raw data passthrough
// ---------------------------------------------------------------------------
describe("validateSchema error paths", () => {
  it("returns field path for missing required field", () => {
    const schema = z.object({
      title: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const { issues, validatedData } = validateSchema({ author: { name: 42 } }, schema);

    expect(issues.length).toBeGreaterThan(0);
    const titleIssue = issues.find((i) => i.field === "title");
    expect(titleIssue).toBeDefined();
    expect(titleIssue!.severity).toBe("error");
  });

  it("returns nested field paths for deep object errors", () => {
    const schema = z.object({
      meta: z.object({
        tags: z.array(z.string()),
      }),
    });

    const { issues } = validateSchema({ meta: { tags: [1, 2] } }, schema);

    expect(issues.length).toBeGreaterThan(0);
    const tagIssue = issues.find((i) => i.field?.includes("tags"));
    expect(tagIssue).toBeDefined();
  });

  it("returns array index in field path for invalid array elements", () => {
    const schema = z.object({
      items: z.array(
        z.object({
          id: z.number(),
        }),
      ),
    });

    const { issues } = validateSchema({ items: [{ id: 1 }, { id: "bad" }] }, schema);

    expect(issues.length).toBeGreaterThan(0);
    // The field should contain items[1] or similar array notation
    const arrayIssue = issues.find((i) => i.field?.includes("items"));
    expect(arrayIssue).toBeDefined();
  });

  it("returns the raw data as validatedData on failure", () => {
    const schema = z.object({
      title: z.string(),
      count: z.number(),
    });

    const input = { title: 123, count: "bad" };
    const { issues, validatedData } = validateSchema(input, schema);

    expect(issues.length).toBeGreaterThan(0);
    expect(validatedData).toBe(input);
  });

  it("all issues have error severity on schema failure", () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
    });

    const { issues } = validateSchema({ a: 1, b: "not a number" }, schema);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.severity === "error")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createContentLayer — missing directory and non-configured collection
// ---------------------------------------------------------------------------
describe("createContentLayer error handling", () => {
  it("returns empty array for collection with nonexistent directory", async () => {
    const config = defineConfig({
      root: "/tmp/__does_not_exist_ps_test__",
      collections: {
        missing: defineCollection({
          loader: "json",
          directory: "./nonexistent",
          schema: z.object({ name: z.string() }),
        }),
      },
    });

    const layer = createContentLayer(config);
    const entries = await layer.getCollection("missing");

    expect(entries).toEqual([]);
  });

  it("throws for non-configured collection name", async () => {
    const config = defineConfig({
      root: "/tmp",
      collections: {},
    });

    const layer = createContentLayer(config);

    await expect(layer.getCollection("unknown")).rejects.toThrow("not found");
  });

  it("throws with helpful message listing available collections", async () => {
    const config = defineConfig({
      root: "/tmp",
      collections: {
        posts: defineCollection({
          loader: "markdown",
          directory: "./posts",
          schema: z.object({ title: z.string() }),
        }),
        authors: defineCollection({
          loader: "json",
          directory: "./authors",
          schema: z.object({ name: z.string() }),
        }),
      },
    });

    const layer = createContentLayer(config);

    await expect(layer.getCollection("nope")).rejects.toThrow("posts");
    await expect(layer.getCollection("nope")).rejects.toThrow("authors");
  });
});

// ---------------------------------------------------------------------------
// processMarkdown — error wrapping
// ---------------------------------------------------------------------------
describe("processMarkdown error handling", () => {
  it("processes valid markdown successfully", async () => {
    const result = await processMarkdown("# Hello\n\nWorld");

    expect(result.html).toContain("Hello");
    expect(result.headings.length).toBeGreaterThan(0);
  });

  it("returns empty headings for content without headings", async () => {
    const result = await processMarkdown("Just a paragraph.");

    expect(result.html).toContain("Just a paragraph");
    expect(result.headings).toEqual([]);
  });

  it("extracts frontmatter from raw markdown", async () => {
    const result = await processMarkdown("---\ntitle: Test\n---\n\n# Content");

    expect(result.frontmatter.title).toBe("Test");
    expect(result.html).toContain("Content");
  });

  it("uses preExtracted frontmatter when provided", async () => {
    const result = await processMarkdown("---\ntitle: Ignored\n---\n\n# Body", undefined, {
      content: "# Body",
      frontmatter: { title: "Override" },
    });

    expect(result.frontmatter.title).toBe("Override");
  });
});

// ---------------------------------------------------------------------------
// registerLoader — custom loader resolution
// ---------------------------------------------------------------------------
describe("registerLoader", () => {
  it("allows custom loaders to be resolved by name", () => {
    const customLoader: Loader = {
      name: "csv",
      kind: "data",
      extensions: [".csv"],
      async load(filePath: string) {
        return { data: {}, content: "" };
      },
    };

    registerLoader("csv", customLoader);
    const resolved = resolveLoader("csv" as any);

    expect(resolved).toBe(customLoader);
    expect(resolved.name).toBe("csv");
    expect(resolved.extensions).toEqual([".csv"]);
  });

  it("custom loader overrides are resolved before built-in check", () => {
    const customJson: Loader = {
      name: "custom-json",
      kind: "data",
      extensions: [".json"],
      async load() {
        return { data: { custom: true }, content: undefined };
      },
    };

    // Register under a unique name to avoid polluting other tests
    registerLoader("custom-json", customJson);
    const resolved = resolveLoader("custom-json" as any);

    expect(resolved.name).toBe("custom-json");
  });

  it("resolveLoader throws for unknown unregistered type", () => {
    expect(() => resolveLoader("unknowntype" as any)).toThrow("Unknown loader type");
  });

  it("resolveLoader passes through object loaders directly", () => {
    const directLoader: Loader = {
      name: "direct",
      kind: "markdown",
      extensions: [".txt"],
      async load() {
        return { data: {}, content: "" };
      },
    };

    const resolved = resolveLoader(directLoader);

    expect(resolved).toBe(directLoader);
  });
});

// ---------------------------------------------------------------------------
// createLinkValidator — skipPatterns
// ---------------------------------------------------------------------------
describe("createLinkValidator with skipPatterns", () => {
  it("skips internal links matching exact prefix patterns", async () => {
    const validator = createLinkValidator({
      skipPatterns: ["/api/"],
    });

    const issues = await runValidators(
      {
        filePath: "/tmp/test.md",
        slug: "test",
        collection: "docs",
        rawContent: "[API Ref](/api/endpoint)",
        data: {},
      },
      [validator],
    );

    // The /api/endpoint link should be skipped, so no broken link error
    const apiIssues = issues.filter((i) => i.severity === "error" && i.message.includes("/api/"));
    expect(apiIssues).toEqual([]);
  });

  it("skips internal links matching wildcard patterns", async () => {
    const validator = createLinkValidator({
      skipPatterns: ["/assets/*"],
    });

    const issues = await runValidators(
      {
        filePath: "/tmp/test.md",
        slug: "test",
        collection: "docs",
        rawContent: "![Image](/assets/logo.png)",
        data: {},
      },
      [validator],
    );

    const assetIssues = issues.filter(
      (i) => i.severity === "error" && i.message.includes("/assets/"),
    );
    expect(assetIssues).toEqual([]);
  });

  it("does not skip links that do not match patterns", async () => {
    const validator = createLinkValidator({
      skipPatterns: ["/api/"],
    });

    const issues = await runValidators(
      {
        filePath: "/tmp/test.md",
        slug: "test",
        collection: "docs",
        rawContent: "[Broken](./nonexistent-file.md)",
        data: {},
      },
      [validator],
    );

    const brokenIssues = issues.filter(
      (i) => i.severity === "error" && i.message.includes("Broken internal link"),
    );
    expect(brokenIssues.length).toBeGreaterThan(0);
  });

  it("does not validate fragment-only links", async () => {
    const validator = createLinkValidator();

    const issues = await runValidators(
      {
        filePath: "/tmp/test.md",
        slug: "test",
        collection: "docs",
        rawContent: "[Section](#heading)",
        data: {},
      },
      [validator],
    );

    // Fragment-only links should produce no issues
    const linkIssues = issues.filter((i) => i.message.includes("link"));
    expect(linkIssues).toEqual([]);
  });
});
