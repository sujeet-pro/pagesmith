import type { AiInstallProfile } from "./types";
import { PAGESMITH_TITLE } from "./content-shared";

export function renderCodexSkill(profile: AiInstallProfile): string {
  return [
    `# ${PAGESMITH_TITLE} Skill`,
    "",
    "Use this skill when the task involves setting up, extending, migrating, or documenting Pagesmith.",
    "",
    "Core rules:",
    "- `@pagesmith/core` provides the content layer, `@pagesmith/site` adds the shared site toolkit, and `@pagesmith/docs` adds convention-based documentation",
    "- prefer `defineCollection`, `defineConfig`, and `createContentLayer`",
    "- start with `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` for content-layer bootstrap or retrofit work",
    "- if the project also uses `@pagesmith/site`, start with `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` before changing site shell, preset, or SSG behavior",
    "- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`",
    ...(profile === "docs"
      ? [
          "- when bootstrapping or retrofitting docs, start with `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`",
          "- for shared site shell, preset, or runtime work inside docs projects, also read `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` and `node_modules/@pagesmith/site/REFERENCE.md`",
          "- read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` and `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` before changing docs structure or authored markdown",
          "- when the repo uses `@pagesmith/docs`, treat `content/README.md` as the home page",
          "- top-level content folders define the main docs navigation",
          "- docs frontmatter may use `sidebarLabel`, `navLabel`, and `order` to shape navigation",
          "- `pagesmith.config.json5` should own footer links and high-level site metadata",
          "- use the version-matched schema files in `node_modules/@pagesmith/docs/schemas/` for config, meta.json5, and frontmatter edits; when the config lives at the repo root, keep `$schema` pointing at `./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`",
          "- built-in search is Pagefind; do not suggest separate search plugin packages",
        ]
      : []),
    "",
    "For package usage guidance and full API reference, read:",
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
    "Good outputs include:",
    "- collection schemas and loader configuration",
    "- content-layer queries and rendering examples",
    "- documentation updates for Pagesmith usage",
    "- assistant-context install via `npx pagesmith-core ai --profile default` for core/site projects or `npx pagesmith-docs init --ai` for docs projects",
  ].join("\n");
}
