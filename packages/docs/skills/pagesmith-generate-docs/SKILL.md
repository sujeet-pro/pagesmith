---
name: pagesmith-generate-docs
description: Generate a complete multi-page documentation set for a project — product overview, quickstart, guides, and API/reference — inside an existing @pagesmith/docs site. Use when the user asks to "document this codebase", "auto-generate docs for my package", "write docs for me", or wants the agent to seed a Pagesmith docs site with real content derived from the project, not just a skeleton.
---

# Generate A Full Pagesmith Docs Set

This skill produces real documentation content. It is the step after `pagesmith-docs-setup` — once the site is wired up, use this to seed meaningful pages from the actual codebase.

## Read the locally installed reference first

Before generating frontmatter, meta files, or running CLI commands, open `node_modules/@pagesmith/docs/REFERENCE.md` plus the schemas under `node_modules/@pagesmith/docs/schemas/` in the consumer's project. They are version-matched to the installed package and authoritative for frontmatter shape, `meta.json5` keys, and the `pagesmith-docs` CLI surface. If they disagree with this skill or general training data, follow the local files.

Always invoke the CLI through `npx pagesmith-docs <command>` (or via `package.json` scripts) so it resolves to the project's `node_modules/.bin` instead of any globally installed binary that may be a different version.

## Prerequisites

- A working `@pagesmith/docs` site (`pagesmith.config.json5` exists, `npx pagesmith-docs dev` works).
- Read access to the target project (source code, README, CHANGELOG, schemas, examples).
- If the site is not set up yet, run `pagesmith-docs-setup` first.

## Workflow

### 1. Discover what to document

Before writing anything, scan the project and collect a list of topics. Prefer real artifacts over guesses:

- `README.md` — turn into a home page + `guide/overview.md`.
- `CHANGELOG.md` or `RELEASES.md` — becomes `reference/changelog.md`.
- `package.json` `exports` — each entry is a candidate reference page.
- `src/` entry points and public CLI bins — guide pages for each.
- Example apps, usage snippets, integration guides — become "How to" pages.
- Existing design docs, RFCs, or internal wikis — lift only what applies.

Record the inventory as a plan in `.temp/plans/pagesmith-generate-docs.md` (or the equivalent scratch location — do not commit it).

### 2. Decide the information architecture

Recommended two-track structure (matches the default `pagesmith-docs init`):

```
docs/
  README.md                  # home
  guide/
    meta.json5
    overview.md
    quickstart.md
    concepts/
      meta.json5
      <one file per key concept>.md
    how-to/
      meta.json5
      <one file per recipe>.md
  reference/
    meta.json5
    api/
      meta.json5
      <one file per public API surface>.md
    cli/
      meta.json5
      <one file per command>.md
    config.md
    changelog.md
```

Deviate when the project clearly demands it (single-CLI tool, library-only, website generator). Keep the nesting at most three levels deep.

### 3. Generate pages

For **every** page you create, follow `pagesmith-docs-add-page`:

- Correct frontmatter (`title`, `description`, optional `order`).
- `$schema` pointing at `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`.
- Section `meta.json5` files with `title`, `order`, and `pages` when you want deterministic ordering.
- Root `meta.json5` covering top-level `sections` and `header`.

Content rules while generating:

- Lead each page with a one-sentence purpose statement.
- Copy **exact** code snippets from the source. Do not paraphrase API signatures.
- For every prose claim about behavior, cite the file path in the source tree (comment or inline link).
- Prefer real input/output examples over descriptions of behavior.
- Never invent APIs. If something is unclear, write "TODO: verify" and move on — easier to review than to debug.

### 4. Populate navigation

After all pages exist, write or update:

- Root `meta.json5` — pick the final order of top-level sections and any external header links.
- Each section's `meta.json5` — list pages in the order you want them to appear in the sidebar.

Keep auto-listing behavior (omit `pages`) only for drafty sections where the final ordering is not yet decided.

### 5. Add diagrams and screenshots where they help

- Put source assets in `<page-folder>/diagrams/<name>.mmd|svg|tsx`.
- Reference them with relative paths: `![Flow](./diagrams/flow.svg)`.
- Do not hotlink external image hosts; images bundled with the docs survive deploys and do not break.

### 6. Validate

Run in order:

```bash
npx pagesmith-docs build
```

Fix every schema error (missing `description`, invalid `pages` entry, broken link) before moving on.

```bash
npx pagesmith-docs dev
```

Walk through each new page manually:

- Sidebar placement is right.
- TOC mirrors the page headings.
- Internal links resolve.
- Code blocks render with the correct language.
- Search returns sensible results for the first page's title.

### 7. Wire docs scripts and CI

Once content stabilizes, add scripts if they are not already present:

```json
{
  "scripts": {
    "docs:dev": "pagesmith-docs dev",
    "docs:build": "pagesmith-docs build",
    "docs:preview": "pagesmith-docs preview"
  }
}
```

If the user also wants GitHub Pages deployment, run `pagesmith-docs-deploy-gh-pages` after the content lands.

## Page templates

### Home (`docs/README.md`)

```md
---
$schema: ../node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json
title: <Project>
description: <one-line value prop for SEO>
hero:
  title: <Project>
  tagline: <short tagline>
  actions:
    - label: Quickstart
      href: /guide/quickstart
    - label: GitHub
      href: https://github.com/<owner>/<repo>
features:
  - title: <pillar 1>
    description: <one sentence>
  - title: <pillar 2>
    description: <one sentence>
  - title: <pillar 3>
    description: <one sentence>
---

# <Project>

<Opening paragraph: what this is, who it's for, one tangible example.>
```

### Quickstart (`docs/guide/quickstart.md`)

````md
---
title: Quickstart
description: Get up and running with <Project> in under 5 minutes.
order: 1
---

# Quickstart

## Install

```bash
npm add <package>
```
````

## Run

```bash
npx <command>
```

## Verify

```bash
<verification command>
```

## Next steps

- <link to a concept page>
- <link to a how-to page>

````

### Concept page (`docs/guide/concepts/<concept>.md`)

```md
---
title: <Concept>
description: <what it is, why it matters>
order: <n>
---

# <Concept>

## What it is

<one paragraph>

## Why it exists

<one paragraph>

## Example

```ts
<real code from the source tree>
````

## Related

- <link to related concept / how-to>

````

### How-to (`docs/guide/how-to/<task>.md`)

```md
---
title: <Task>
description: Step-by-step recipe for <task>.
---

# <Task>

## When to use this

<one sentence>

## Steps

1. ...
2. ...
3. ...

## Verify

<how to confirm it worked>

## Gotchas

- <non-obvious pitfall>
````

### Reference page (`docs/reference/api/<surface>.md`)

````md
---
title: <Public API surface>
description: Reference for <API surface>.
---

# <Public API surface>

## Import

```ts
import { <X> } from '<package>'
```
````

## Signature

```ts
<type signature>
```

## Parameters

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

## Returns

<description>

## Example

```ts
<minimal working example>
```

## Errors

| Error | Cause | Fix |
| ----- | ----- | --- |

```

## Gotchas

- Do not copy README content blindly — READMEs tend to mix promotion with reference. Split them: promotion goes in `home`, reference goes in `reference/`, and narrative goes in `guide/`.
- Respect `draft: true` on anything you are unsure about. Better to hide a half-written page than to ship wrong docs.
- API reference pages must match the public `exports` in `package.json` exactly. Do not document internal modules.
- Keep navigation shallow — three levels deep is the practical limit for readability (`guide/concepts/auth.md`, not `guide/concepts/auth/deep/dive.md`).
- Always run `pagesmith-docs build` at the end. A dev server can mask broken schema or missing pages that fail production builds.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `./references/docs-guidelines.md`
- `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json`
- Sibling skills: `pagesmith-docs-add-page`, `pagesmith-docs-configure-nav`, `pagesmith-docs-add-search`, `pagesmith-docs-customize-theme`, `pagesmith-docs-deploy-gh-pages`.
```
