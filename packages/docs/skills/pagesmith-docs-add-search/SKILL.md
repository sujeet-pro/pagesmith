---
name: pagesmith-docs-add-search
description: Enable or customize Pagefind-powered full-text search in a @pagesmith/docs site — toggle it on, tune heading weights, scope the index, add a custom search trigger, or fix a broken search box. Use when the user asks about docs search, Pagefind, Cmd+K, or a missing search UI.
---

# Add Search To A Pagesmith Docs Site

`@pagesmith/docs` bundles [Pagefind](https://pagefind.app/) and wires it into build + runtime. You do **not** install or run Pagefind yourself.

## Read the locally installed reference first

Before editing config or running CLI commands, open `node_modules/@pagesmith/docs/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and is the authoritative source for the `search.*` config schema and the `pagesmith-docs` CLI surface. If it disagrees with this skill or general training data, follow the local file.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` rather than any globally installed binary that may be a different version.

## Enable

In `pagesmith.config.json5`:

```json5
{
  search: {
    enabled: true,
  },
}
```

That alone gives you:

- Cmd+K / Ctrl+K keyboard shortcut.
- A visible trigger in the header (built-in layout).
- Pagefind index built into `<outDir>/pagefind/` on `pagesmith-docs build`.
- Search UI styled to match the docs theme.

## Configuration keys

The `search` object is validated against `packages/docs/schemas/pagesmith-config.schema.json`. Supported keys (everything else is rejected at build time):

| Key              | Type       | Default | Purpose                                                                                                                                                                                                                                                                                     |
| ---------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`        | `boolean`  | `true`  | Toggle the whole integration. When `false`: skip the Pagefind binary at build, drop the Pagefind UI script + stylesheet from every page, omit the modal and trigger markup, and do not emit `<outDir>/pagefind/`. Use this to shave the WASM + index + UI bundle when search is not needed. |
| `showImages`     | `boolean`  | `false` | Show images inside result tiles.                                                                                                                                                                                                                                                            |
| `showSubResults` | `boolean`  | `true`  | Show per-heading sub-results for long pages.                                                                                                                                                                                                                                                |
| `pagefindFlags`  | `string[]` | `[]`    | Extra CLI flags forwarded to `pagefind` during `pagesmith-docs build`.                                                                                                                                                                                                                      |

```json5
{
  search: {
    enabled: true,
    showImages: false,
    showSubResults: true,
    pagefindFlags: ["--exclude-selectors", ".no-index"],
  },
}
```

There is no `weights` or `exclude` key. Use frontmatter `draft: true` to hide a page, and the Pagefind `data-pagefind-ignore` / `data-pagefind-weight` attributes on elements inside a layout to tune what gets indexed.

## Scope the index from content

Because Pagesmith calls Pagefind over the built HTML, you scope the index with attributes and frontmatter, not a config-level glob:

- Mark any HTML region with `data-pagefind-ignore` to omit it from the index.
- Use `data-pagefind-weight="N"` on an element to boost or demote that region.
- Wrap the page body with `data-pagefind-body` in your custom layout so nav/footer chrome does not dominate results (the default layouts already do this).
- Set frontmatter `draft: true` on individual pages to exclude them from the build entirely.

## Custom trigger placement

The shipped `SiteHeader` already renders a trigger. When you author a custom layout, add any element with `data-ps-search-trigger` to open the modal — the `runtime/search-trigger` module (bundled into `runtime/chrome` and `runtime/standalone`) wires it up.

```tsx
<button type="button" data-ps-search-trigger>
  Search docs
  <kbd>⌘K</kbd>
</button>
```

When `search.enabled` is `false` the runtime is not shipped, so these buttons are inert — safe to leave in shared templates across environments.

## Preview the built index

```bash
npx pagesmith-docs build
npx pagesmith-docs preview
```

The preview server streams directly from `outDir`, so search works without a CDN or extra runtime.

## Keyboard & accessibility

- Cmd+K (macOS) / Ctrl+K (others) opens the search modal.
- `/` also opens the modal.
- Escape closes it.
- The modal traps focus and returns it to the trigger when closed.

Do not reimplement these shortcuts — the shipped runtime already wires them up.

## CI health checks

After a `build`, verify:

- `<outDir>/pagefind/` exists and is non-empty.
- `<outDir>/pagefind/pagefind.js` is present.
- Total index size is under a few MB. If it exceeds 5 MB, tighten `exclude` or break large reference pages into smaller ones.

## Common problems

| Symptom                                      | Fix                                                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Search icon missing in header                | Confirm `search.enabled: true` in `pagesmith.config.json5`. Restart `dev`.                                                                                                           |
| "No results" for content that clearly exists | Check the page frontmatter: `draft: true` excludes it from the index.                                                                                                                |
| Results point at wrong URLs on deploy        | `basePath` drift — make sure the built host matches `basePath`. Do not hand-edit URLs.                                                                                               |
| Heavy first-load                             | Wrap noisy regions with `data-pagefind-ignore`, or drop huge reference tables into non-indexed pages via frontmatter `draft: true`.                                                  |
| Custom trigger not opening search            | The trigger button must have `data-ps-search-trigger` and the page must ship `@pagesmith/site/runtime/search-trigger` (already included in `runtime/chrome` / `runtime/standalone`). |

## Gotchas

- Pagefind runs during `pagesmith-docs build`. `dev` uses a lightweight fallback — minor ranking differences between dev and build are expected.
- Do not run `pagefind` CLI separately. Pagesmith orchestrates build + index + runtime together; a manual run produces an index that does not match Pagesmith's asset hashing.
- When `basePath` is set, client JS fetches `<basePath>/pagefind/...`. Do not hand-assemble that URL; rely on the runtime + `data-ps-search-trigger` hook.
- The Pagefind component-UI script is loaded as a `<script type="module">`, so `document.currentScript` is `null` and Pagefind cannot auto-detect its bundle path. Pagesmith sidesteps this by emitting an explicit `<pagefind-config bundle-path="<basePath>/pagefind/">` element directly before the loader script. You should not set the bundle path yourself — overriding it would shadow the auto-derived value and break sub-path deploys.
- Disabling search does not remove Pagefind from `node_modules`. That is expected — it is a transitive dependency. Build output, however, contains zero Pagefind assets when `enabled: false`.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/docs-guidelines.md`
- Pagefind docs: https://pagefind.app/
