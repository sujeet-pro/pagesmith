import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  buildFileSchemaMap,
  discoverContentConfig,
  loadContentCollections,
  loadContentSchemaMap,
} from "../validation/load-content-config";

describe("content.config auto-load", () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "ps-content-config-"));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
    tempDirs.length = 0;
  });

  it("discovers content.config.ts in the configured search directory", () => {
    const dir = makeTempDir();
    writeFileSync(join(dir, "content.config.ts"), "export default {}\n");

    const found = discoverContentConfig([dir]);
    expect(found).not.toBeNull();
    expect(found!.filePath.endsWith("content.config.ts")).toBe(true);
    expect(found!.projectRoot).toBe(dir);
  });

  it("returns null when no config is present", () => {
    const dir = makeTempDir();
    expect(discoverContentConfig([dir])).toBeNull();
  });

  it("loads a collections map from a TS module via Node type-stripping", async () => {
    const dir = makeTempDir();
    writeFileSync(
      join(dir, "content.config.ts"),
      [
        "import { z } from 'zod'",
        "",
        "const ArticleSchema = z.object({ title: z.string(), tags: z.array(z.string()).default([]) })",
        "",
        "export default {",
        "  articles: {",
        "    loader: 'markdown',",
        "    directory: 'content/articles',",
        "    include: ['*/README.md'],",
        "    schema: ArticleSchema,",
        "  },",
        "}",
        "",
      ].join("\n"),
    );

    const collections = await loadContentCollections(join(dir, "content.config.ts"));
    expect(collections).not.toBeNull();
    expect(collections!.articles?.directory).toBe("content/articles");
    const result = collections!.articles?.schema?.safeParse({ title: "Hello" });
    expect(result?.success).toBe(true);
  });

  it("builds a per-file schema lookup honouring declaration order", async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, "content", "articles", "foo"), { recursive: true });
    writeFileSync(join(dir, "content", "articles", "README.md"), "---\ntitle: Index\n---\n");
    writeFileSync(join(dir, "content", "articles", "foo", "README.md"), "---\ntitle: Foo\n---\n");
    writeFileSync(
      join(dir, "content.config.ts"),
      [
        "import { z } from 'zod'",
        "",
        "export default {",
        "  articleIndex: {",
        "    loader: 'markdown',",
        "    directory: 'content/articles',",
        "    include: ['README.md'],",
        "    schema: z.object({ title: z.string() }),",
        "  },",
        "  articles: {",
        "    loader: 'markdown',",
        "    directory: 'content/articles',",
        "    include: ['*/README.md'],",
        "    schema: z.object({ title: z.string(), tags: z.array(z.string()).optional() }),",
        "  },",
        "}",
        "",
      ].join("\n"),
    );

    const loaded = await loadContentSchemaMap([dir]);
    expect(loaded).not.toBeNull();
    const indexEntry = loaded!.schemaByFile.get(join(dir, "content", "articles", "README.md"));
    const fooEntry = loaded!.schemaByFile.get(join(dir, "content", "articles", "foo", "README.md"));
    expect(indexEntry?.collectionName).toBe("articleIndex");
    expect(fooEntry?.collectionName).toBe("articles");
  });

  it("skips collections whose loader is not markdown", async () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, "content"), { recursive: true });
    writeFileSync(join(dir, "content", "meta.json5"), "{}");
    writeFileSync(
      join(dir, "content.config.ts"),
      [
        "import { z } from 'zod'",
        "",
        "export default {",
        "  rootMeta: {",
        "    loader: 'data',",
        "    directory: 'content',",
        "    include: ['meta.json5'],",
        "    schema: z.object({}).passthrough(),",
        "  },",
        "}",
        "",
      ].join("\n"),
    );

    const collections = await loadContentCollections(join(dir, "content.config.ts"));
    const map = await buildFileSchemaMap(collections!, dir);
    expect(map.size).toBe(0);
  });
});
