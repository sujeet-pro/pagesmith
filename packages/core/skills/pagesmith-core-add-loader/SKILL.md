---
name: pagesmith-core-add-loader
description: Implement a custom content loader for @pagesmith/core to support a file format or source that the built-in loaders (markdown, json, json5, jsonc, yaml, toml) do not cover. Use when the user needs MDX, org-mode, remote CMS content, a custom binary format, or any non-standard source.
allowed-tools: Bash(npx pagesmith-core *)
---

# Add A Custom Pagesmith Loader

`@pagesmith/core` ships loaders for `markdown`, `json`, `json5`, `jsonc`, `yaml`, and `toml`. If the format you need is outside that set, write a `Loader`.

## Read the locally installed reference first

Before implementing the loader, open `node_modules/@pagesmith/core/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for the `Loader`/`LoaderResult`/`LoaderError` types, the entry returned to the content store, and the rules around `rawContent` and `extensions`. If it disagrees with this skill or general training data, follow the local file.

Run verification commands (`npx vite dev`, `npx vitest`) through `npx` or `package.json` scripts so they resolve to the project's `node_modules/.bin` instead of a globally installed binary that may be a different version.

## When to use this skill

- Content format: MDX, org-mode, AsciiDoc, reStructuredText.
- Content source: REST API, GraphQL endpoint, database export, Notion, Airtable.
- Custom binary formats that must be decoded before validation.

If you only need to massage markdown (add a frontmatter field, run a preprocessor), prefer `pagesmith-core-customize-markdown` instead.

## Implement the `Loader` interface

```ts
// loaders/mdx-loader.ts
import type { Loader, LoaderResult } from "@pagesmith/core/loaders";
import { readFile } from "node:fs/promises";
import matter from "gray-matter";

export class MdxLoader implements Loader {
  readonly name = "mdx";
  readonly extensions = [".mdx"] as const;

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, "utf-8");
    const parsed = matter(raw);
    return {
      data: parsed.data,
      rawContent: parsed.content,
    };
  }
}
```

The `Loader` contract is small:

| Field            | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `name`           | Unique string identifier — used in logs and errors.                  |
| `extensions`     | Tuple of file extensions, with leading dot. Used for file discovery. |
| `load(filePath)` | Async function returning `{ data, rawContent? }`.                    |

`rawContent` is optional and only meaningful for entries that will go through `entry.render()` later (markdown-style pipeline). For pure data loaders, return `{ data }` and skip `rawContent`.

## Attach to a collection

```ts
import { defineCollection, z } from "@pagesmith/core";
import { MdxLoader } from "./loaders/mdx-loader";

export const pages = defineCollection({
  loader: new MdxLoader(),
  directory: "content/pages",
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});
```

If the loader's extensions don't match the collection's default glob, widen it:

```ts
defineCollection({
  loader: new MdxLoader(),
  directory: "content/pages",
  include: ["**/*.mdx"],
  schema,
});
```

## Remote / virtual loaders

A loader can skip the filesystem entirely. Example for a REST-backed collection:

```ts
// loaders/cms-loader.ts
import type { Loader, LoaderResult } from "@pagesmith/core/loaders";

export class CmsLoader implements Loader {
  readonly name = "cms";
  readonly extensions = [".json"] as const; // filesystem marker file

  constructor(private readonly endpoint: string) {}

  async load(filePath: string): Promise<LoaderResult> {
    const slug = path.basename(filePath, ".json");
    const resp = await fetch(`${this.endpoint}/${slug}`);
    if (!resp.ok) throw new LoaderError(`CMS fetch failed for ${slug}: ${resp.status}`);
    const data = await resp.json();
    return { data, rawContent: data.body };
  }
}
```

Marker files under `content/cms/*.json` act as a manifest that Pagesmith can still glob, while the loader fetches the actual content at build time.

## Error handling

Throw `LoaderError` for parse failures with context the agent can act on:

```ts
import { LoaderError } from "@pagesmith/core/loaders";

throw new LoaderError(`Unexpected token near line ${line}`, { cause: err });
```

The content store catches `LoaderError` and surfaces the file path and message without crashing the whole build.

## Unit-test the loader

Loaders are pure functions of a file path, so they are easy to test:

```ts
// tests/mdx-loader.test.ts
import { describe, expect, it } from "vitest";
import { MdxLoader } from "../src/loaders/mdx-loader";

describe("MdxLoader", () => {
  it("parses frontmatter and body", async () => {
    const loader = new MdxLoader();
    const result = await loader.load("fixtures/hello.mdx");
    expect(result.data.title).toBe("Hello");
    expect(result.rawContent).toContain("<Sidebar");
  });
});
```

## Verify end-to-end

```bash
npx vite dev
```

- Files in the collection's directory must be discovered (add/remove one; dev should hot-reload).
- `entry.data` matches the schema.
- `entry.render()` (if your loader emits `rawContent`) returns non-empty HTML.
- Drop an intentionally malformed file and confirm the error surfaces with the file path.

## Rules

- Keep loaders pure: no caching, no IO outside the single `load(filePath)` call. Pagesmith already caches in the content store.
- Do not run markdown through the loader — `entry.render()` owns the markdown pipeline. If you transform markdown-specific content, emit `rawContent` and let `render()` do its job.
- Return only `{ data, rawContent? }`. Extra fields are silently dropped.
- Do not call filesystem APIs that mutate files. Loaders are read-only.

## Gotchas

- `extensions` must each start with `.` and be lowercase. Missing dots silently disable file discovery.
- If two loaders claim the same extension for different collections, Pagesmith picks them per-collection — that is fine. Two different loaders on the **same** collection is an error.
- Async `load` is required. Synchronous loaders should still return `Promise.resolve(...)` so Pagesmith can await uniformly.
- Virtual/remote loaders still need real marker files on disk — Pagesmith uses glob to enumerate them. A loader that tries to dynamically invent slugs outside the filesystem will be invisible to the content store.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `./references/core-guidelines.md`
- Sibling skills: `pagesmith-core-add-collection`, `pagesmith-core-customize-markdown`.
