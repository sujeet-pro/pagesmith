// Repo-internal build tooling shared by every publishable package's
// `vite.config.ts` (`packages/core`, `packages/site`). It is NOT part of any
// npm tarball — it lives under `scripts/` alongside the other build helpers
// (`build-packages.ts`, `sync-package-versions.ts`, …) and is imported by the
// package configs via a relative path. Keeping it in one place stops the two
// near-identical copies that previously lived inline in each config from
// drifting apart.
//
// The transform itself is exported separately from the plugin wrapper so it
// can be unit-tested with plain strings (see
// `tests/integration/fix-postcss-dts-imports.test.ts`) without spinning up a
// Rolldown/Vite build.

/** Files whose `.d.ts`/`.d.mts`/`.d.cts` output this transform rewrites. */
export const POSTCSS_DTS_RE = /node_modules\/(postcss|lightningcss|vite)\/.*\.d\.(ts|mts|cts)$/;

/**
 * Rewrite type-only imports/exports in postcss/lightningcss/vite `.d.ts`
 * files that lack the `type` modifier, which otherwise trip MISSING_EXPORT
 * warnings from the DTS bundler.
 *
 * Handles three patterns, scoped by `id`:
 * 1. Any matched file: `import Default, { Named }` →
 *    `import type { default as Default, Named }`.
 * 2. postcss/lightningcss re-exports: `export { Named } from '...'` →
 *    `export type { Named } from '...'`.
 * 3. vite `.d.ts`: `import ... from 'postcss'|'lightningcss'` →
 *    `import type ... from '...'`.
 */
export function fixPostcssDtsCode(code: string, id: string): string {
  let result = code;
  // Convert `import DefaultExport, { Named1, Named2 } from '...'`
  // into `import type { default as DefaultExport, Named1, Named2 } from '...'`
  result = result.replace(
    /^import\s+(\w+)\s*,\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])/gm,
    (_, defaultName, named, source) =>
      `import type { default as ${defaultName}, ${named} } from ${source}`,
  );
  // Convert `export { Named1, Named2 } from '...'`
  // into `export type { Named1, Named2 } from '...'`
  // (only for postcss/lightningcss .d.mts re-exports)
  if (/node_modules\/(postcss|lightningcss)\//.test(id)) {
    result = result.replace(
      /^(export\s+)(?!type\s)(\{[^}]+\}\s*from\s*['"][^'"]+['"])/gm,
      "$1type $2",
    );
  }
  // For vite .d.ts: add type modifier to imports from postcss/lightningcss
  if (/node_modules\/vite\//.test(id)) {
    result = result.replace(
      /^(import\s+)(?!type\s)(.+from\s+['"](?:postcss|lightningcss)['"])/gm,
      "import type $2",
    );
  }
  return result;
}

/**
 * Rolldown plugin that fixes postcss/lightningcss/vite `.d.ts`/`.d.mts` files
 * where type-only imports/exports lack the `type` modifier, causing
 * MISSING_EXPORT warnings from the DTS bundler. Registered in each package's
 * `vite.config.ts` `pack.plugins` array.
 */
export function fixPostcssDtsImports() {
  return {
    name: "pagesmith:fix-postcss-dts-imports",
    transform: {
      filter: { id: { include: [POSTCSS_DTS_RE] } },
      handler(code: string, id: string) {
        return fixPostcssDtsCode(code, id);
      },
    },
  };
}
