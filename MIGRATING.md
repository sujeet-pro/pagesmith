# Migrating to Current Pre-1.0 API

Pagesmith is still pre-1.0, so breaking changes are expected between minor releases while the package boundaries settle.

This guide covers the current split into `@pagesmith/core`, `@pagesmith/site`, and `@pagesmith/docs`.

## 0.9.6 (patch)

Additive updates, no breaking changes. Highlights:

- `@pagesmith/core` — new `imageStructureValidator` enforces the canonical `<figure> > <picture> > <source>* + <img> + <figcaption>?` shape and catches common mistakes (`<figure>` nested in `<picture>`, missing/multiple `<img>`, unbalanced tags, disallowed inner elements). The validator is now part of `builtinMarkdownValidators` and runs by default on every content entry. Fenced code and inline code are stripped from the raw-content sweep so documentation examples are not false-flagged.
- `@pagesmith/core` — new `requireCanonicalInternalLinks` option on `createLinkValidator`. When true, internal page links must be authored as `./relative/path/README.md` (or `./x.md`, `../x/README.md`). Absolute `/guide/foo` and bare `./foo` / `./foo/` forms become errors. Images, `#fragment`-only, `mailto:` / `tel:`, external URLs, and URLs under configured `additionalRoots` stay exempt. Opt-in at the core level; `@pagesmith/docs` turns it on by default.
- `@pagesmith/site` / `@pagesmith/docs` — new `--require-canonical-internal-links` / `--no-require-canonical-internal-links` flags on `validate`. `@pagesmith/docs` validate enables the rule by default; `--full` picks it up automatically.
- `@pagesmith/core` — the `internalLinksMustBeMarkdown` rule now exempts links that resolve through registered `additionalRoots`, so passthrough asset URLs (`/llms.txt`, `/prompts/*.md`, `/schemas/*.json`) no longer false-trip the check.
- Repo-level — the root docs content directory moved from `docs-site/` to `docs/`. The internal workspace keeps the name `@pagesmith/docs-site` to avoid colliding with the published `@pagesmith/docs` package. Consumers building docs via `pagesmith.config.json5` should update `contentDir` to match their own rename if they want to follow suit — no change is forced.
- Repo-level — `scripts/validate-pagesmith.ts` gains a new cross-reference check: every URL shipped through `pagesmith.config.json5#assets` must be linked from at least one content page, so bundled `llms.txt`, `llms-full.txt`, prompts, and schemas stay discoverable.
- CLI documentation synced to code: `pagesmith-docs build --base-path`, `pagesmith-docs init --name/--title/--search/--starter-content`, and the full `pagesmith-docs validate` / `pagesmith-site validate` flag tables are now reflected in `REFERENCE.md` for each package and in the docs site's CLI reference page.

No action required to upgrade. Enforce the new link rule in your own repo by passing `--require-canonical-internal-links` to `pagesmith-docs validate` (or enabling `--full`).

## High-impact changes

### Consumer AI surface moved: `ai-guidelines/` → per-package `skills/` + package-root `llms*.txt`

**Breaking change.** The `ai-guidelines/` folder that used to ship in every package tarball is gone. Consumer AI guidance now lives in per-package, self-contained Agent Skills plus package-scoped `llms.txt` / `llms-full.txt` at the package root.

Old layout inside a package tarball:

```
node_modules/@pagesmith/<pkg>/
├── REFERENCE.md
├── ai-guidelines/
│   ├── setup-<pkg>.md
│   ├── <pkg>-guidelines.md
│   ├── markdown-guidelines.md
│   ├── usage.md, recipes.md, errors.md, migration.md, changelog-notes.md
│   ├── AGENTS.md.template
│   └── llms.txt, llms-full.txt
└── dist/
```

New layout:

```
node_modules/@pagesmith/<pkg>/
├── REFERENCE.md
├── llms.txt                               # package-scoped compact AI index
├── llms-full.txt                          # package-scoped full AI context
├── skills/
│   ├── pagesmith-<pkg>-setup/
│   │   ├── SKILL.md
│   │   └── references/                    # self-contained copies of what this skill needs
│   │       ├── setup-<pkg>.md
│   │       ├── <pkg>-guidelines.md
│   │       ├── usage.md, recipes.md, errors.md, migration.md, changelog-notes.md
│   │       └── AGENTS.md.template
│   ├── pagesmith-<pkg>-<action>/          # one folder per task-specific skill
│   │   ├── SKILL.md
│   │   └── references/
│   └── ...
└── dist/
```

Canonical "equivalent" path mapping:

| Old path | New path |
| --- | --- |
| `@pagesmith/<pkg>/ai-guidelines/llms.txt` | `@pagesmith/<pkg>/llms.txt` |
| `@pagesmith/<pkg>/ai-guidelines/llms-full.txt` | `@pagesmith/<pkg>/llms-full.txt` |
| `@pagesmith/<pkg>/ai-guidelines/setup-<pkg>.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/setup-<pkg>.md` |
| `@pagesmith/<pkg>/ai-guidelines/<pkg>-guidelines.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/<pkg>-guidelines.md` |
| `@pagesmith/<pkg>/ai-guidelines/markdown-guidelines.md` | `@pagesmith/core/skills/pagesmith-core-customize-markdown/references/markdown-guidelines.md` (core) or `@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` (docs) |
| `@pagesmith/<pkg>/ai-guidelines/usage.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/usage.md` |
| `@pagesmith/<pkg>/ai-guidelines/recipes.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/recipes.md` |
| `@pagesmith/<pkg>/ai-guidelines/errors.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/errors.md` |
| `@pagesmith/<pkg>/ai-guidelines/migration.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/migration.md` |
| `@pagesmith/<pkg>/ai-guidelines/changelog-notes.md` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/changelog-notes.md` |
| `@pagesmith/<pkg>/ai-guidelines/AGENTS.md.template` | `@pagesmith/<pkg>/skills/pagesmith-<pkg>-setup/references/AGENTS.md.template` |

Subpath exports in `package.json` followed the same rename:

- `@pagesmith/<pkg>/ai-guidelines/*` → `@pagesmith/<pkg>/skills/*`
- `@pagesmith/<pkg>/llms` still works and now resolves to `./llms.txt`
- `@pagesmith/<pkg>/llms-full` still works and now resolves to `./llms-full.txt`
- `@pagesmith/<pkg>/agents/*` still works and now resolves to the same file under `./skills/pagesmith-<pkg>-setup/references/`

**What to update in a consumer project**

1. Search your `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and any custom agent prompts for `@pagesmith/<pkg>/ai-guidelines/` and replace with the new paths from the table above (or run `npx pagesmith-core ai --profile default` to regenerate the AI scaffolding with the latest pointers).
2. If you hand-rolled any tooling that globs `node_modules/@pagesmith/<pkg>/ai-guidelines/**`, point it at `node_modules/@pagesmith/<pkg>/skills/**/references/**` instead.
3. The root `skills/pagesmith-*` folder that used to live at the Pagesmith repo root is gone — each skill now ships with its owning package. Consumers that previously ran `npx skills install @pagesmith/pagesmith-<skill>` should now install skills from their owning package path (e.g. `node_modules/@pagesmith/core/skills/pagesmith-core-add-loader/`).

## Other high-impact changes

### Three-package architecture

- `@pagesmith/core` is now the headless content layer.
- `@pagesmith/site` owns the `pagesmith-site` CLI (`pagesmith` remains a compatibility alias), re-exported content APIs, JSX runtime, shared CSS/runtime bundles, SSG helpers, and preset loading.
- `@pagesmith/docs` is the opinionated docs preset and theme built on top of the site/content stack.

### Import moves

Keep these imports in `@pagesmith/core`:

- collections, schemas, loaders, validation
- markdown helpers
- `pagesmithContent`
- MCP helpers from `@pagesmith/core/mcp`

Move these imports to `@pagesmith/site`:

- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`
- `SsgRenderConfig`
- JSX runtime imports
- CSS bundle imports
- runtime JS imports
- `ssg-utils`

Typical migration:

```ts
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

```tsx
import { Fragment } from '@pagesmith/site/jsx-runtime'
```

```css
@import '@pagesmith/site/css/content';
```

### Docs preset and CLI

- `pagesmith-site` is the canonical CLI from `@pagesmith/site`.
- `pagesmith-docs` is the canonical CLI from `@pagesmith/docs`.
- Use `@pagesmith/docs/preset` only when you are deliberately driving docs through `pagesmith-site`; docs-first projects should prefer `pagesmith-docs` instead of configuring the preset manually.

### Example dev/build commands

- Use `vite dev` and `vite build` in example-style integrations.
- Framework-hosted integrations such as Next.js can keep their own build commands and use `@pagesmith/core` directly for content loading/rendering.
- Add `@pagesmith/site/css/*` and `@pagesmith/site/runtime/*` only when those apps want Pagesmith's shipped markdown presentation/runtime layer without Pagesmith's Vite plugins.
- Avoid relying on `vp` in downstream example apps unless you intentionally use Vite+ in that project.

### AI-first docs workflow

- Preferred setup path is `npx pagesmith-docs init --ai`.
- Onboarding-first navigation ordering is expected for docs guides.

### CLI rebuild on `cac` + `@clack/prompts`

All three CLIs (`pagesmith-core`, `pagesmith-site`, `pagesmith-docs`) now share a common foundation under `@pagesmith/core/cli-kit`:

- Argument parsing moved from hand-rolled parsers to [`cac`](https://github.com/cacjs/cac). All public flags retained their spelling; auto-generated `--help` and `--version` now describe every command and option.
- Interactive flows use modern [`@clack/prompts`](https://bomb.sh/docs/clack/packages/prompts/) primitives (`group`, `tasks`, `spinner`, `note`, `log.*`).
- The `--no-interactive` alias was dropped (it conflicted with `--interactive`'s mri negation). Use `--non-interactive` (or `--yes`) for CI/CD.
- Non-interactive mode is now strict: `pagesmith-docs init` errors when `--name`, `--origin`, or `--base-path` cannot be resolved from flags, an existing `pagesmith.config.{ts,json5,...}`, or smart defaults (git remote, package.json, repo basename). Other CLIs preserve their existing fail-fast behavior on missing positional arguments / required flags.

### TypeScript config support

`pagesmith-docs` (and the docs preset behind `pagesmith-site`) now resolves the config file in this order:

1. `--config <path>`
2. `pagesmith.config.ts`
3. `pagesmith.config.mts`
4. `pagesmith.config.mjs`
5. `pagesmith.config.js`
6. `pagesmith.config.json5`
7. `pagesmith.config.json`

`.ts/.mts` are loaded via `jiti`; `.js/.mjs` via dynamic `import()`. Prompt defaults in `pagesmith-docs init` come from whichever config file is present.

A new `defineConfig` export is available from `@pagesmith/docs` (alias of `defineDocsConfig`) so users can author type-safe configs:

```ts
// pagesmith.config.ts
import { defineConfig } from '@pagesmith/docs'
export default defineConfig({ name: 'my-docs', basePath: '/my-docs' })
```

`init` continues to write JSON5; when a TypeScript config is detected it reads the values for prompt defaults but leaves the file untouched (the user owns code-shaped configs).

The synchronous `loadDocsConfig` / `resolveDocsConfig` helpers stay JSON5-only for back-compat. Use the new async `loadDocsConfigAsync` / `resolveDocsConfigAsync` (also re-exported from `@pagesmith/docs`) when you need to load any supported config format programmatically.

## Suggested upgrade checklist

1. Update imports so headless-only content concerns stay on `@pagesmith/core`, while site-app imports move to `@pagesmith/site`.
2. Update JSX `jsxImportSource` values from `@pagesmith/core` to `@pagesmith/site` where you use the built-in JSX runtime.
3. Update CSS and runtime imports from `@pagesmith/core/css/*` and `@pagesmith/core/runtime/*` to `@pagesmith/site/css/*` and `@pagesmith/site/runtime/*`.
4. For docs projects, prefer `pagesmith-docs` and a plain `pagesmith.config.json5`; only keep `preset: '@pagesmith/docs'` when you are intentionally routing docs through `pagesmith-site`.
5. Re-run docs scaffolding if needed with `npx pagesmith-docs init --ai`.
6. Run:
   - `vp check`
   - `vp test`
   - `npm run build:examples`

## Where to look for version-matched details

- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/changelog-notes.md`
- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/changelog-notes.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
