# @pagesmith/docs Authoring Guidelines

AI-first but human-readable documentation guidance for projects using `@pagesmith/docs`.

Use this file when writing or reorganizing docs content. For bootstrap or retrofit work, start with `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`. For exact markdown syntax, code block rules, and diagram embedding constraints, read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`.

## Read Order

1. `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` for first-time setup or retrofit work
2. `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` when upgrading an existing integration
3. `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` for authoring, organization, and diagram workflow
4. `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` for supported content syntax
5. `node_modules/@pagesmith/docs/REFERENCE.md` for exact config, frontmatter, layout, and deployment details
6. `node_modules/@pagesmith/docs/schemas/*.schema.json` when editing `pagesmith.config.json5`, `meta.json5`, or docs frontmatter

## What `@pagesmith/docs` Gives You

- A convention-based docs site built on the Pagesmith content + site stack
- A repo-root `pagesmith.config.json5` or zero-config conventions around `docs/` or `content/`
- A docs home page from `<contentDir>/README.md`
- Top navigation from top-level content folders
- Flat per-section sidebars with ordering and grouping from `meta.json5`
- Built-in search, breadcrumbs, prev/next links, theme controls, edit links, and layout overrides backed by the reusable `@pagesmith/site` chrome/layout layer
- Asset publishing via `publicDir`, `assets`, automatic root `llms.txt` / `llms-full.txt` copying, and content-relative companion asset rewrites for page-local images/diagrams
- The shared Pagesmith markdown pipeline, code renderer, math, alerts, tables, and validators described in `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`

## AI-First, Human-Readable Docs

- Lead with the task, decision, or takeaway before background.
- Keep pages skimmable: short intro, clear headings, short paragraphs, and concrete lists.
- Prefer copy-pasteable commands, file paths, config snippets, and examples over abstract prose.
- Explain why a step or setting matters, not just what to type.
- Keep names consistent across commands, files, config fields, and navigation labels.
- Write so a human can learn from the page and an AI can reliably extend or refactor it later.
- Make prerequisites, defaults, side effects, and outputs explicit instead of assuming hidden context.
- Use GitHub Alerts for warnings, caveats, or strong tips, not for routine filler.
- Add a diagram only when it removes ambiguity or reduces cognitive load. Skip it when a short list, table, or example is clearer.
- When updating a page, also update its navigation metadata, cross-links, examples, and diagrams if they have drifted.

## Organize Docs Deliberately

- Keep the docs home page at `<contentDir>/README.md`.
- Use top-level folders as primary nav sections such as `guide/`, `reference/`, `tutorials/`, or `packages/`.
- Prefer folder-based pages like `<section>/<slug>/README.md`, especially when a page owns images, downloadable assets, or diagrams.
- Keep page-local assets beside the page, usually under `<section>/<slug>/diagrams/` or a small sibling asset folder.
- Use `meta.json5` in each section to control `displayName`, `items`, `series`, `collapsed`, and `orderBy`.
- Keep onboarding and getting-started content first in manual section order.
- Remember that nested markdown pages stay in their top-level section and section sidebars remain flat.
- Use docs frontmatter deliberately: `title`, `description`, `navLabel`, `sidebarLabel`, `order`, `draft`.
- Use the `DocHome` fields only on the home page: `layout`, `tagline`, `install`, `actions`, `features`, `packages`, `codeExample`.

## Use Built-In Docs Features

- Use `DocHome` when the home page needs a polished landing experience with hero content, feature cards, package cards, and a code sample.
- Use `meta.json5` `series` when a section needs guided reading order. Pages not referenced by a series still stay visible under the automatic `Miscellaneous` group.
- Use `assets` or `publicDir` when docs need stable URLs for schemas, prompts, OpenAPI files, downloads, or other machine-readable artifacts.
- Use page-local markdown companion assets for page-owned images and diagrams; stock docs publishes them under flat content-hashed `/assets/name.hash.ext` paths.
- Use `.only-light` and `.only-dark` on images when a diagram or screenshot needs theme-specific rendered variants.
- Use `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.listing`, and `theme.layouts.notFound` only when the default docs experience is insufficient. When overriding, prefer composing `@pagesmith/docs/components` and `@pagesmith/docs/layouts` before copying docs-theme internals.
- Keep `data-pagefind-body` on the content-only wrapper in custom layouts so search indexes the page body instead of the whole shell.
- Use the built-in search and navigation instead of bolting on separate search or sidebar systems.

## When Writing Or Updating Docs

1. Read the related page plus `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` before changing structure or syntax.
2. Choose the right location in the docs tree and update the relevant `meta.json5` ordering.
3. Add frontmatter with at least `title` and `description`.
4. Write for both scanning and execution: what it is, when to use it, steps, examples, verification, and troubleshooting when needed.
5. Use supported markdown features only. Do not assume extra remark or rehype plugins exist unless the project intentionally drops to lower-level `@pagesmith/core` APIs or a custom integration.
6. Decide whether a diagram would clarify a flow, architecture, lifecycle, dependency graph, or system boundary better than prose alone.
7. If a diagram helps, keep the editable source and rendered assets with the page, then embed the rendered asset in the document.
8. Verify internal links, heading order, and final navigation placement in preview or build output.
9. Use relative links between content pages (e.g., `../getting-started`, `./sub-page`). The docs link transform resolves them to root-relative URLs under `basePath` and formats them according to the `trailingSlash` config (default: `false` — slashless URLs).

## Diagram Guidance

Stock `@pagesmith/docs` does not turn raw `mermaid`, `dot`, `excalidraw`, or `drawio` fences into live diagrams. Those language names are useful for syntax-highlighted source examples, but published diagrams should be generated as assets and embedded as images.

### Pick The Right Diagram Tool

| Need                                                                                    | Best choice | Why                                         |
| --------------------------------------------------------------------------------------- | ----------- | ------------------------------------------- |
| Flowcharts, sequence diagrams, state diagrams, ER diagrams, timelines, simple C4 views  | Mermaid     | Text-first, diff-friendly, and fast to edit |
| Architecture overviews, conceptual maps, presentation-style sketches                    | Excalidraw  | Hand-drawn feel and flexible layout         |
| Network topology, BPMN, cloud/vendor icon diagrams, precise layout, multi-page diagrams | draw.io     | Rich libraries and manual control           |
| Dependency graphs, call graphs, existing `.dot` assets, rank-constrained layouts        | Graphviz    | Strong algorithmic layout                   |

### Diagram Workflow

- Prefer a page-local `diagrams/` folder:

```text
docs/
  guide/
    architecture/
      README.md
      diagrams/
        system-overview.mermaid
        system-overview-light.svg
        system-overview-dark.svg
```

- Keep the editable source file alongside rendered output.
- Prefer rendered SVG. Add PNG variants only when another surface needs them.
- For Mermaid source files that will be embedded as SVG images, add `%%{init: {'htmlLabels': false}}%%` at the top so the rendered asset avoids `foreignObject` and works reliably in `<img>` tags.
- When light and dark versions differ, wrap the pair in a `<figure>` and embed both with `.only-light` and `.only-dark`.
- Always write descriptive alt text and add a sentence nearby that explains the point of the diagram.
- If the repo already has an established diagram format, keep using it instead of switching engines midstream.

### Embed Theme-Aware Diagrams

```html
<figure>
  <img
    src="./diagrams/system-overview-light.svg"
    class="only-light"
    alt="System overview showing requests moving from the CLI through the API layer into storage"
  />
  <img
    src="./diagrams/system-overview-dark.svg"
    class="only-dark"
    alt="System overview showing requests moving from the CLI through the API layer into storage"
  />
</figure>
```

## References

- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/*.schema.json`
