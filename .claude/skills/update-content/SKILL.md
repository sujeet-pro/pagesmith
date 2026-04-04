# Update Content

Update documentation and example app content to match the current implementation of `@pagesmith/core` and `@pagesmith/docs`.

## When to use

Use this skill when docs or example content has drifted from the implementation — e.g., after a feature change, API rename, or plugin swap.

## Workflow

1. **Load package-shipped AI guidance first (source of truth)**:
   - `node_modules/@pagesmith/core/docs/agents/usage.md`
   - `node_modules/@pagesmith/core/docs/agents/recipes.md`
   - `node_modules/@pagesmith/docs/docs/agents/usage.md`
   - `node_modules/@pagesmith/docs/docs/agents/recipes.md`
   - If running inside the Pagesmith monorepo, use:
     - `packages/core/docs/agents/usage.md`
     - `packages/docs/docs/agents/usage.md`

2. **Audit implementation** — Read the source files that changed and map deltas against package guidance.

3. **Scan docs for references** — Grep `docs/content/` for keywords related to the changed feature. Read each matching file to determine if the content is accurate.

4. **Scan examples for references** — Grep `examples/` (both content markdown files and READMEs) for the same keywords. Also check template files (`templates/*.ejs`, `templates/*.hbs`) and runtime files (`src/runtime.ts`).

5. **Fix discrepancies** — Edit each file to match the current implementation and package guidance. Common patterns:
   - Feature described as "manual JS" but now handled by a plugin → remove manual JS docs, reference the plugin
   - API renamed or signature changed → update code examples
   - Config option added/removed → update config reference tables
   - CSS export changed → update import path tables

6. **Verify consistency** — After edits, grep for the old terminology to confirm no references remain.

## Key facts about current implementation

- **Copy buttons** on code blocks are provided by Expressive Code inline scripts. No runtime JS needed.
- **Runtime JS** (both core standalone and docs) provides only: TOC highlighting, search modal, sidebar toggle. No copy-code.
- **Expressive Code** handles: syntax highlighting, dual themes, line numbers, file titles, copy button, collapse, mark/ins/del, language badges, text wrapping, frame styles. All injected inline.
- **CSS exports** from core: `content`, `standalone`, `viewport`, `fonts`. Code block CSS is NOT in these — Expressive Code injects its own.
- **Frontmatter** for docs pages: title, description, navLabel, sidebarLabel, order, draft (all optional). Home page has additional: hero, install, actions, features, packages, codeExample.
- **Vite plugins**: `pagesmithContent`, `pagesmithSsg`, `sharedAssetsPlugin` — all from `@pagesmith/core/vite`.
