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

The home page accepts extra frontmatter (hero, features, CTAs). Use the home schema:

```md
---
$schema: ../node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json
title: My Docs
description: Short blurb used for SEO.
hero:
  title: My Project
  tagline: Short value prop.
  actions:
    - label: Quickstart
      href: /guide/quickstart
    - label: GitHub
      href: https://github.com/...
features:
  - title: Fast
    description: ...
  - title: Typed
    description: ...
---

# My Docs

Optional markdown body below the hero.
```

If a home frontmatter field is missing (for example `description`), Pagesmith fails the build with a schema error. Fill all required fields.

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

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`
- `./references/docs-guidelines.md`
