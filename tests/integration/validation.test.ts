import { describe, expect, it } from "vite-plus/test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createContentLayer, defineCollection, defineConfig, z } from "@pagesmith/core";

describe("validation", () => {
  it("catches schema validation errors", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ps-val-"));
    try {
      writeFileSync(join(dir, "bad.json"), JSON.stringify({ name: 123 }));

      const config = defineConfig({
        root: dir,
        collections: {
          items: defineCollection({
            loader: "json",
            directory: ".",
            schema: z.object({ name: z.string() }),
          }),
        },
      });
      const layer = createContentLayer(config);
      const results = await layer.validate("items");
      expect(results.length).toBe(1);
      expect(results[0]!.errors).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("passes validation for well-formed content", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ps-val-"));
    try {
      writeFileSync(join(dir, "good.json"), JSON.stringify({ name: "Valid" }));

      const config = defineConfig({
        root: dir,
        collections: {
          items: defineCollection({
            loader: "json",
            directory: ".",
            schema: z.object({ name: z.string() }),
          }),
        },
      });
      const layer = createContentLayer(config);
      const results = await layer.validate("items");
      expect(results[0]!.errors).toBe(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("validates markdown heading structure", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ps-val-"));
    try {
      writeFileSync(
        join(dir, "bad-headings.md"),
        "---\ntitle: Test\n---\n\n# First H1\n\n# Second H1\n\n#### Skipped to H4\n",
      );

      const config = defineConfig({
        root: dir,
        collections: {
          docs: defineCollection({
            loader: "markdown",
            directory: ".",
            schema: z.object({ title: z.string() }),
          }),
        },
      });
      const layer = createContentLayer(config);
      const results = await layer.validate("docs");
      const issues = results[0]!.entries[0]?.issues ?? [];
      expect(issues.length).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
