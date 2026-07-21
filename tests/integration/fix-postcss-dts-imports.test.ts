import { describe, expect, it } from "vite-plus/test";
import {
  fixPostcssDtsCode,
  fixPostcssDtsImports,
  POSTCSS_DTS_RE,
} from "../../scripts/vite/fix-postcss-dts-imports.ts";

const POSTCSS_ID = "/repo/node_modules/postcss/lib/postcss.d.mts";
const LIGHTNINGCSS_ID = "/repo/node_modules/lightningcss/node/index.d.ts";
const VITE_ID = "/repo/node_modules/vite/dist/node/index.d.ts";

describe("fix-postcss-dts-imports", () => {
  describe("fixPostcssDtsCode", () => {
    it("rewrites a default+named import into a type-only import for any matched file", () => {
      const code = `import Processor, { Plugin, Root } from './processor.js'`;
      // The named-import capture preserves the original inner whitespace.
      expect(fixPostcssDtsCode(code, POSTCSS_ID)).toBe(
        `import type { default as Processor,  Plugin, Root  } from './processor.js'`,
      );
    });

    it("rewrites bare re-exports to type-only exports for postcss files", () => {
      const code = `export { Plugin, Root } from './postcss.js'`;
      expect(fixPostcssDtsCode(code, POSTCSS_ID)).toBe(
        `export type { Plugin, Root } from './postcss.js'`,
      );
    });

    it("rewrites re-exports for lightningcss files too", () => {
      const code = `export { TransformOptions } from './types.js'`;
      expect(fixPostcssDtsCode(code, LIGHTNINGCSS_ID)).toBe(
        `export type { TransformOptions } from './types.js'`,
      );
    });

    it("does NOT rewrite re-exports for vite files (only postcss/lightningcss)", () => {
      const code = `export { SomeType } from './x.js'`;
      // No `export type` promotion for vite; the export stays as-is.
      expect(fixPostcssDtsCode(code, VITE_ID)).toBe(code);
    });

    it("adds a type modifier to vite imports from postcss/lightningcss", () => {
      const code = `import { Plugin } from 'postcss'`;
      expect(fixPostcssDtsCode(code, VITE_ID)).toBe(`import type { Plugin } from 'postcss'`);
    });

    it("leaves an already type-only export untouched", () => {
      const code = `export type { Plugin } from './postcss.js'`;
      expect(fixPostcssDtsCode(code, POSTCSS_ID)).toBe(code);
    });

    it("leaves unrelated code untouched", () => {
      const code = `const x = 1;\nexport const y = x + 1;\n`;
      expect(fixPostcssDtsCode(code, POSTCSS_ID)).toBe(code);
    });
  });

  describe("POSTCSS_DTS_RE", () => {
    it("matches postcss/lightningcss/vite declaration files", () => {
      expect(POSTCSS_DTS_RE.test(POSTCSS_ID)).toBe(true);
      expect(POSTCSS_DTS_RE.test(LIGHTNINGCSS_ID)).toBe(true);
      expect(POSTCSS_DTS_RE.test(VITE_ID)).toBe(true);
    });

    it("does not match unrelated modules or non-declaration files", () => {
      expect(POSTCSS_DTS_RE.test("/repo/node_modules/react/index.d.ts")).toBe(false);
      expect(POSTCSS_DTS_RE.test("/repo/node_modules/postcss/lib/postcss.js")).toBe(false);
    });
  });

  describe("fixPostcssDtsImports", () => {
    it("returns a Rolldown plugin whose handler delegates to fixPostcssDtsCode", () => {
      const plugin = fixPostcssDtsImports();
      expect(plugin.name).toBe("pagesmith:fix-postcss-dts-imports");
      const code = `import Processor, { Plugin } from './processor.js'`;
      expect(plugin.transform.handler(code, POSTCSS_ID)).toBe(
        `import type { default as Processor,  Plugin  } from './processor.js'`,
      );
    });
  });
});
