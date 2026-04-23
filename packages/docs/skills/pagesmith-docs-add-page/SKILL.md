---
name: pagesmith-docs-add-page
description: Add a new page (guide, reference, or home) to an existing @pagesmith/docs site with correct frontmatter, file placement, and sidebar ordering. Use when the user wants to write a new doc page, document a feature in their Pagesmith site, add a quickstart, or extend an existing docs section — even if they don't mention "Pagesmith" explicitly.
---

# Add A Page To A Pagesmith Docs Site

Use this skill whenever the user wants new content in a Pagesmith-backed docs site. If `pagesmith.config.json5` does not exist yet, run `pagesmith-docs-setup` first.

## Read the locally installed reference first

Before editing config or running CLI commands, open `node_modules/@pagesmith/docs/REFERENCE.md` and `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json` in the consumer's project. They are version-matched to the installed package and are authoritative for frontmatter fields and CLI flags. If they disagree with this skill or general training data, follow the local files.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` instead of any globally installed binary that may be a different version.

## Where pages live

Pagesmith reads `contentDir` from `pagesmith.config.json5`. Typical layouts:

| Page                | File                                    | URL                      |
| ------------------- | --------------------------------------- | ------------------------ |
| Home                | `<contentDir>/README.md` or `home.md`   | `/`                      |
| Top-level guide     | `<contentDir>/guide/<slug>.md`          | `/guide/<slug>`          |
| Top-level reference | `<contentDir>/reference/<slug>.md`      | `/reference/<slug>`      |
| Series page         | `<contentDir>/guide/<series>/<slug>.md` | `/guide/<series>/<slug>` |
| Section landing     | `<contentDir>/guide/<series>/README.md` | `/guide/<series>`        |

The URL is always slashless — both `/guide/install` and `/guide/install/` resolve. Do not hand-append `.html` or trailing slashes to links.

## Minimal page template

```md
---
title: Install
description: Get Pagesmith running locally in under a minute.
order: 1
---

# Install

Short intro sentence.

## Prerequisites

- Node.js 24+.

## Steps

1. ...
```

Required frontmatter: `title`, `description`. Optional: `order`, `draft`, `tags`, `lastUpdatedOn`, `$schema`.

Use `$schema` so editors can auto-complete frontmatter:

```md
---
$schema: ../../node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json
title: Install
description: ...
---
```

Path to the schema is relative to the markdown file.

## Home page

The home page (`<contentDir>/README.md` or `home.md`) is rendered by the
default `DocHome` layout, which understands a richer frontmatter shape than a
regular page. Every block below is optional — omit the key and the section is
skipped. Pin the schema so editors auto-complete and the build catches typos:

```md
---
$schema: ../node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json
title: My Project
description: Short blurb used for SEO and the hero subtitle fallback.
---
```

### Field reference

| Field         | Type                                                                                           | Renders as                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `title`       | string                                                                                         | Hero `name` line + `<title>`.                                                |
| `description` | string                                                                                         | Hero `tagline` fallback + `<meta name="description">`.                       |
| `tagline`     | string                                                                                         | Hero `text` line (the big H1).                                               |
| `badge`       | string                                                                                         | Pill above the hero (e.g. `v0.9 — preview`).                                 |
| `actions`     | `{ text, link, theme?: "brand" \| "alt", icon? }[]`                                            | Hero CTA buttons.                                                            |
| `hero`        | `{ name?, text?, tagline?, badge?, actions? }`                                                 | Full hero override; wins over the top-level shorthands.                      |
| `features`    | `{ title, details, icon? }[]`                                                                  | Feature card grid. `icon` is inlined as raw SVG (`innerHTML`).               |
| `install`     | string \| `{ code, lang?, title?, frame?: "code" \| "terminal" \| "plain", showLineNumbers? }` | Install snippet under the hero, rendered through the markdown code pipeline. |
| `packages`    | `{ name, description, href?, tag?, version?, npmPackage?: string \| false }[]`                 | Package card grid with optional NPM badge per card.                          |
| `codeExample` | `{ code, label?, title? }`                                                                     | Quick-start `<pre>` in terminal chrome at the bottom.                        |

> [!IMPORTANT]
> Field names are easy to get wrong:
>
> - `actions[]` use **`text`** and **`link`** (not `label`/`href`).
> - `features[]` use **`title`** and **`details`** (not `description`).
> - `hero.text` is the big H1, `hero.name` is the small line above it.

### Hero shorthands

The layout synthesizes a hero from `title` + `tagline` + `actions` + `badge` if
no `hero:` block is given — so for most sites you only need the shorthands:

```md
---
$schema: ../node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json
title: My Project
tagline: Filesystem-first content for docs and static sites.
description: Typed content collections, convention-based docs, and assistant artifacts.
badge: v0.9 — preview
actions:
  - text: Quickstart
    link: /guide/quickstart
    theme: brand
  - text: GitHub
    link: https://github.com/<owner>/<repo>
    theme: alt
---
```

Override the synthesized hero with an explicit `hero:` block when you need a
different `name` line or a hero-only `badge`/`actions`.

### Install snippet (`install`)

The home install block is rendered through the same Pagesmith markdown code
pipeline as fenced code blocks elsewhere on the site (Shiki highlighting,
multi-line line numbers, frame chrome, copy button, tab grouping). Two forms
are accepted:

```md
---
install: npm install @pagesmith/docs
---
```

```md
---
install:
  code: |
    npm install @pagesmith/docs
    npx pagesmith-docs init --yes --ai
  lang: bash # any Shiki language; defaults to `bash`
  title: Terminal # toolbar label
  frame: terminal # `terminal` (traffic lights) | `code` | `plain`
  showLineNumbers: true
---
```

Use `frame: terminal` for shell input, `frame: code` for source snippets, and
`frame: plain` for a borderless block. `showLineNumbers` defaults to `true` for
multi-line input and `false` for single-line.

### Package cards with auto-fetched npm badges (`packages`)

Each entry renders as a card. When a card looks like an npm package (a name
of the form `my-pkg` or `@scope/my-pkg`), the docs build automatically fetches
the latest published version from the npm registry at build time and inlines a
ready-to-paint NPM badge SVG (with explicit width/height — no CLS):

```md
---
packages:
  - name: "@pagesmith/core"
    description: Headless content layer with collections, loaders, schemas.
    href: /reference/api
    tag: Core
  - name: "@pagesmith/site"
    description: Site toolkit, JSX runtime, CSS/runtime bundles, Vite SSG helpers.
    href: /guide/frameworks
    tag: Site
  - name: "@pagesmith/docs"
    description: Convention-based docs preset built on core and site.
    href: /guide/docs-getting-started
    tag: Docs
    version: "0.9.9" # pin manually instead of fetching
    npmPackage: false # opt out of registry lookup + badge entirely
---
```

Notes:

- `name` doubles as the displayed title and the default registry lookup key.
- `npmPackage: "<other-name>"` overrides the registry lookup key without changing the displayed `name`.
- `npmPackage: false` skips the registry call and the inline badge, leaving only the manual `version` pill (if set) and `tag` chip.
- Registry lookups are cached for 1 hour under `node_modules/.cache/pagesmith-docs-npm/versions.json`. Network failures, timeouts (4s), and unpublished packages degrade silently to "no badge" — they never fail the build.
- Cards become clickable when `href` is set; otherwise the card is a static `<div>`.

### Quick-start code block (`codeExample`)

Renders one final `<pre>` in terminal chrome below the packages grid. Use it
for the smallest config or first-call snippet:

```md
---
codeExample:
  label: Quick Start # section header above the block
  title: pagesmith.config.json5 # toolbar label
  code: |
    {
      $schema: "./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json",
      contentDir: "docs",
    }
---
```

Unlike `install`, `codeExample.code` is **not** run through the Shiki pipeline
— it's injected as raw HTML into the `<pre>`. Pre-format it (or use `install`
instead) if you want syntax highlighting.

### Features grid (`features`)

```md
---
features:
  - title: Filesystem-First CMS
    details: Markdown, JSON, JSONC, JSON5, YAML, TOML, and custom loaders with Zod-backed schemas.
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
  - title: Built-in Code Renderer
    details: Dual-theme syntax highlighting, line numbers, file titles, diff markers, and copy buttons — zero config.
---
```

`icon` accepts a raw inline SVG string (rendered via `innerHTML`). Keep icons
square, ~24px, and use `currentColor` so they pick up the theme palette.

### Body content

Markdown content below the frontmatter renders inside a `.prose` section under
all home modules — use it for a longer "Philosophy" or "Why this exists"
block. Leave it empty if the hero + grids are enough.

### Validation

The home schema marks every field as optional and falls back gracefully to
`pagesmith.config.json5` (`name`, `title`, `description`) when fields are
missing — so the build does not fail on omissions. But the editor / IDE will
flag wrong field names (`label` instead of `text`, `description` instead of
`details`) the moment `$schema` is pinned. Always pin `$schema` and treat any
schema warning as an error to fix before commit.

## Section landing pages

Each `meta.json5` section can have a custom landing page at `<section>/README.md` (or `<section>/index.md`). If the landing file is absent, Pagesmith auto-generates a listing page that enumerates the section's children — this is a feature, not a bug. Override only when you want a tailored intro.

## Navigation

For a brand-new page to show up in the sidebar:

1. Place it in the correct section folder.
2. Confirm the section's `meta.json5` either:
   - lists it explicitly in `pages`, or
   - omits `pages` entirely (Pagesmith auto-picks up new files).
3. Set `order` on the frontmatter (lower shows first) when you want a specific position.

If the section's `meta.json5` has a `pages` array, you **must** add the new slug explicitly — the array is authoritative. Otherwise the page is reachable by URL but hidden from navigation.

## Drafts

```md
---
title: Work in progress
description: ...
draft: true
---
```

Draft pages:

- Render in `pagesmith-docs dev` (so you can preview).
- Are **excluded** from `build` output. Do not link to a draft page from another page's body.

## Verify

1. `npx pagesmith-docs dev` — the page must appear at the expected URL and in the sidebar.
2. `npx pagesmith-docs build` — must exit 0. Schema errors surface here.
3. Run `pagesmith-docs build` again after committing to make sure draft pages behave as expected.

## Gotchas

- `title`/`description` must be strings. YAML's unquoted colons break parsing (`description: Use when: X` will fail).
- `order` values are per-section, not global. Two sections can both have an `order: 1` page.
- The auto-generated listing page for a section uses each child page's `title` and `description` frontmatter — keep them short and self-contained.
- If a new page is missing from the sidebar, check the section's `meta.json5` `pages` array first (not the frontmatter).
- Relative image paths work: `![diagram](./diagrams/flow.svg)` resolves correctly for both dev and build.
- Home `actions[]` use `text`/`link` and `features[]` use `title`/`details` — `label`/`href`/`description` will silently render as empty strings.
- Home `install` (object form) is rendered through the markdown code pipeline; `codeExample.code` is **not** — pre-format it or move it into `install` if you want Shiki highlighting.
- Home `packages[]` NPM badges depend on a successful npm-registry lookup at build time. Offline or air-gapped builds silently drop the badge (and fall back to the manual `version` pill if set) — they do not fail the build.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`
- `./references/docs-guidelines.md`
