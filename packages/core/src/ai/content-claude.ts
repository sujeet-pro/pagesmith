import type { AiInstallProfile } from "./types";
import { PAGESMITH_TITLE } from "./content-shared";

export function renderClaudeSkill(skillName: string, profile: AiInstallProfile): string {
  return [
    "---",
    `name: ${skillName}`,
    "description: Pagesmith file-based CMS helper — content collections, markdown pipeline, docs configuration, and AI artifact generation",
    "allowed-tools: Read Grep Glob Bash Edit Write",
    "---",
    "",
    `# ${PAGESMITH_TITLE} Assistant`,
    "",
    "You are helping with Pagesmith, a file-based CMS with `@pagesmith/core`, `@pagesmith/site`, and `@pagesmith/docs`.",
    "",
    "When helping:",
    "- prefer `defineCollection`, `defineConfig`, and `createContentLayer`",
    "- recommend folder-based entries when markdown references sibling assets",
    "- for content-layer bootstrap or retrofit work, start with `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`",
    "- if the project also uses `@pagesmith/site`, start with `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` before changing site shell, preset, or SSG behavior",
    "- for assistant artifact generation in core/site projects, use `npx pagesmith-core ai --profile default`",
    "- for docs projects, use `npx pagesmith-docs init --ai`",
    "- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`",
    ...(profile === "docs"
      ? [
          "- for docs bootstrap or retrofit tasks, start with `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`",
          "- for shared site shell, preset, or runtime work inside docs projects, also read `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` and `node_modules/@pagesmith/site/REFERENCE.md`",
          "- read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` for the docs package workflow and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` for supported markdown features",
          "- for docs sites, derive top navigation from top-level content folders",
          "- use `content/README.md` for the home page",
          "- use frontmatter fields like `sidebarLabel`, `navLabel`, and `order` for docs navigation",
          "- use the version-matched schema files in `node_modules/@pagesmith/docs/schemas/` for config, meta.json5, and frontmatter edits; when the config lives at the repo root, keep `$schema` pointing at `./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`",
          "- Pagefind search is built in — do not suggest separate search plugins",
          "- layout overrides: `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.notFound`",
        ]
      : []),
    "",
    "For package guidance and full API reference, read the package-shipped docs:",
    ...(profile === "docs"
      ? [
          "- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`",
          "- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`",
          "- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md`",
          "- `node_modules/@pagesmith/site/REFERENCE.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`",
          "- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`",
          "- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`",
          "- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`",
          "- `node_modules/@pagesmith/docs/REFERENCE.md`",
          "- `node_modules/@pagesmith/docs/schemas/*.schema.json`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "- `node_modules/@pagesmith/core/REFERENCE.md`",
        ]
      : [
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`",
          "- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "- `node_modules/@pagesmith/core/REFERENCE.md`",
        ]),
    "",
    ...(profile === "docs"
      ? ["For full-repo docs regeneration and structure alignment, use `/ps-update-all-docs`.", ""]
      : []),
    "Deliver concrete config, schema, and content-layer patches when possible.",
  ].join("\n");
}

export function renderUpdateDocsSkill(profile: AiInstallProfile): string {
  const docsSteps =
    profile === "docs"
      ? [
          "1. Read package guidance first: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`, `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`, plus `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, and `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "2. Read `pagesmith.config.json5` to understand the docs configuration",
          "3. Read all `meta.json5` files to understand the current content structure and page ordering",
          "4. Read the project source code to identify public APIs, types, exports, config options, and CLI commands",
          "5. For each existing content page in `content/`:",
          "   - Read the current content",
          "   - Compare with the implementation",
          "   - Update any outdated information",
          "   - Add documentation for new features",
          "   - Remove documentation for removed features",
          "6. If new pages are needed:",
          "   - Create the page folder and `README.md` with proper frontmatter (title, description)",
          "   - Add the slug to the appropriate `meta.json5` `items` array",
          "7. Follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`",
          "8. Review project skills under `.claude/skills/` and ensure docs-writing skills align with Pagesmith docs structure",
          "9. Ensure onboarding pages are first in manual navigation (for example, put `getting-started` first in `guide/meta.json5` when present)",
          "10. Verify all internal links point to existing pages",
          "11. Ensure heading hierarchy is sequential (no skipping levels)",
        ]
      : [
          "1. Read package guidance first: `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, and `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "2. Read `content.config.ts` or equivalent to understand the content collections",
          "3. Read the project source code to identify what needs documentation",
          "4. For each existing content entry:",
          "   - Read the current content",
          "   - Compare with the implementation",
          "   - Update any outdated information",
          "5. If new entries are needed:",
          "   - Create the entry folder and `README.md` with proper frontmatter matching the collection schema",
          "6. Follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`",
          "7. Verify all internal links point to existing pages",
        ];

  return [
    "---",
    "name: update-docs",
    "description: Read the project implementation and update Pagesmith-managed documentation to reflect the current state",
    "allowed-tools: Read Grep Glob Bash Edit Write",
    "---",
    "",
    "# Update Documentation",
    "",
    "Read the project implementation (source code, README, CHANGELOG, package.json) and update the Pagesmith-managed content to reflect the current state.",
    "",
    "## Steps",
    "",
    ...docsSteps,
    "",
    "## Rules",
    "",
    "- Preserve the existing content structure and organization",
    "- Do not remove pages without confirming first",
    "- Keep frontmatter fields (title, description) accurate and descriptive",
    "- Use relative links for internal cross-references",
    "- One h1 per page, sequential heading depth",
    "- Use fenced code blocks with language identifiers",
    "- Use GitHub alerts (`> [!NOTE]`, `> [!TIP]`, etc.) for important callouts",
    '- Code block features: `title="file.js"`, `showLineNumbers`, `mark={1-3}`, `ins={4}`, `del={5}`, `collapse={1-5}`',
  ].join("\n");
}

export function renderUpdateAllDocsSkill(profile: AiInstallProfile): string {
  const docsSteps =
    profile === "docs"
      ? [
          "1. Read package guidance first: `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`, `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md`, `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md`, plus `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, and `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "2. Read `pagesmith.config.json5` and all `meta.json5` files before editing anything",
          "3. Discover project skills in `.claude/skills/`, `.codex/skills/`, and `.gemini/commands/` and identify docs-update related skills",
          "4. Scan source code, README, CHANGELOG, package exports, and CLI commands to build a complete docs delta list",
          "5. Update all docs pages under `content/` to match implementation and remove stale details",
          "6. Ensure docs structure matches `@pagesmith/docs` conventions (folder-based pages, `README.md` entries, relative links)",
          "7. Keep onboarding-first ordering: when a guide section exists, keep `getting-started` as the first item in manual order",
          "8. Update docs-related skills so they generate content in the same structure expected by `@pagesmith/docs`",
          "9. Regenerate or update `llms.txt`, `llms-full.txt`, and project memory pointers when docs behavior changes",
          "10. Follow `.pagesmith/markdown-guidelines.md` for all authored content (GFM, alerts, math, built-in code renderer meta)",
          "11. Validate navigation integrity and ensure every linked page exists",
        ]
      : [
          "1. Read package guidance first: `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md`, `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md`, and `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md`",
          "2. Discover docs/update skills in the project and align them to current Pagesmith conventions",
          "3. Scan source code, README, CHANGELOG, package exports, and CLI commands to build a complete docs delta list",
          "4. Update all content entries to match implementation and remove stale details",
          "5. Follow `.pagesmith/markdown-guidelines.md` for all authored content",
          "6. Validate internal links and heading hierarchy",
        ];

  return [
    "---",
    "name: ps-update-all-docs",
    "description: Full-repo documentation regeneration for Pagesmith projects including docs structure, skills alignment, and AI context updates",
    "allowed-tools: Read Grep Glob Bash Edit Write",
    "---",
    "",
    "# Pagesmith Full Docs Sync",
    "",
    "Perform a full-repository docs refresh for Pagesmith-powered projects. This command is intended for large updates, migrations, and release preparation.",
    "",
    "## Steps",
    "",
    ...docsSteps,
    "",
    "## Rules",
    "",
    "- Preserve existing information architecture unless the user requests a restructure",
    "- Keep docs easy for humans first, while keeping AI memory/skills aligned",
    "- Keep top-level docs navigation driven by content directories and metadata",
    "- Use `meta.json5` and frontmatter for ordering; avoid hardcoded navigation lists in prose",
    "- Keep `content/README.md` as docs home for `@pagesmith/docs` projects",
    "- Keep links relative for internal docs pages",
    "- Use one h1 per page and sequential heading depth",
    "- Use fenced code blocks with language identifiers and built-in Pagesmith code block metadata when useful",
    "- Do not add separate code-copy JavaScript inside markdown content; the built-in renderer already injects its own copy/collapse runtime",
  ].join("\n");
}
