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

## Tune relevance

Override the per-heading-level boost:

```json5
{
  search: {
    enabled: true,
    weights: {
      title: 10,
      h1:    5,
      h2:    3,
      h3:    2,
      body:  1,
    },
  },
}
```

Higher numbers bubble matches in those locations to the top. Keep `title` the highest. Non-integer weights work but stay in the 0-20 range for sanity.

## Scope the index

```json5
{
  search: {
    enabled: true,
    exclude: ['drafts', 'changelog', 'internal/**'],
  },
}
```

`exclude` patterns are glob-style, relative to `contentDir`, and hide pages from search only — pages remain reachable by URL. Use this for internal-only docs, archived pages, or noisy reference tables you don't want in results.

## Custom trigger placement

The default header already ships a trigger. Add more triggers by rendering the component:

```tsx
import { SearchTrigger } from '@pagesmith/docs/components'

<SearchTrigger label="Search docs" />
```

`SearchTrigger` renders nothing when `search.enabled` is false, so it is safe to leave in shared templates across environments.

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

| Symptom | Fix |
| --- | --- |
| Search icon missing in header | Confirm `search.enabled: true` in `pagesmith.config.json5`. Restart `dev`. |
| "No results" for content that clearly exists | Check the page frontmatter: `draft: true` excludes it from the index. |
| Results point at wrong URLs on deploy | `basePath` drift — make sure the built host matches `basePath`. Do not hand-edit URLs. |
| Heavy first-load | Disable search on build-time-only pages with `exclude`, or remove large asset galleries from indexed content. |
| Custom trigger not opening search | Use `SearchTrigger` from `@pagesmith/docs/components`; a raw `<button>` will not. |

## Gotchas

- Pagefind runs during `pagesmith-docs build`. `dev` uses a lightweight fallback — minor ranking differences between dev and build are expected.
- Do not run `pagefind` CLI separately. Pagesmith orchestrates build + index + runtime together; a manual run produces an index that does not match Pagesmith's asset hashing.
- When `basePath` is set, client JS fetches `<basePath>/pagefind/...`. Do not hand-assemble that URL; use the shipped `SearchTrigger`.
- Disabling search does not remove Pagefind from `node_modules`. That is expected — it is a transitive dependency.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/docs-guidelines.md`
- Pagefind docs: https://pagefind.app/
