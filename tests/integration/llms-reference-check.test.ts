import { describe, expect, it } from "vite-plus/test";
import {
  extractFileReferences,
  findDanglingReferences,
} from "../../scripts/llms-reference-check.ts";

describe("llms-reference-check", () => {
  describe("extractFileReferences", () => {
    it("extracts backtick-quoted file-like paths", () => {
      const content = "Read `README.md` then `src/content.ts` before editing `vite.config.ts`.";
      expect(extractFileReferences(content)).toEqual([
        "README.md",
        "src/content.ts",
        "vite.config.ts",
      ]);
    });

    it("ignores backtick spans without a recognized file extension", () => {
      const content = "Call `layer.getCollection(...)` and `defineCollection({...})`.";
      expect(extractFileReferences(content)).toEqual([]);
    });

    it("ignores glob-shaped spans", () => {
      const content = "See `packages/*/src/**` for the pattern.";
      expect(extractFileReferences(content)).toEqual([]);
    });

    it("extracts nested relative paths crossing into other package trees", () => {
      const content =
        "Follow `packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`.";
      expect(extractFileReferences(content)).toEqual([
        "packages/core/skills/pagesmith-core-setup/references/markdown-guidelines.md",
      ]);
    });
  });

  describe("findDanglingReferences", () => {
    it("returns nothing when every reference resolves", () => {
      const content = "See `README.md` and `src/content.ts`.";
      const exists = new Set(["README.md", "src/content.ts"]);
      const dangling = findDanglingReferences(content, (ref) => exists.has(ref));
      expect(dangling).toEqual([]);
    });

    it("reports a reference that does not resolve", () => {
      const content = "See `README.md` and `src/deleted-file.ts`.";
      const exists = new Set(["README.md"]);
      const dangling = findDanglingReferences(content, (ref) => exists.has(ref));
      expect(dangling).toEqual(["src/deleted-file.ts"]);
    });

    it("de-duplicates repeated mentions of the same dangling reference", () => {
      const content = "See `src/gone.ts` — yes, `src/gone.ts` again.";
      const dangling = findDanglingReferences(content, () => false);
      expect(dangling).toEqual(["src/gone.ts"]);
    });

    it("honors the ignore set for known illustrative mentions", () => {
      const content = "Not a `content.config.ts` collection example.";
      const dangling = findDanglingReferences(content, () => false, {
        ignore: new Set(["content.config.ts"]),
      });
      expect(dangling).toEqual([]);
    });
  });
});
