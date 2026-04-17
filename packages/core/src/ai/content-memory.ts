import type { AiAssistant, AiInstallProfile } from './types'
import {
  DEFAULT_SKILL_NAME,
  PAGESMITH_TITLE,
  renderCoreQuickStart,
  renderDocsOverview,
  renderDocsQuickStart,
  renderSharedOverview,
} from './content-shared'

export function renderMemoryFile(assistant: AiAssistant, profile: AiInstallProfile): string {
  const commandHint =
    assistant === 'claude' || assistant === 'gemini'
      ? `\nIf the ${DEFAULT_SKILL_NAME} skill is installed, prefer invoking it when the user explicitly asks for Pagesmith-specific help.`
      : '\nIf the Pagesmith skill is installed for Codex, prefer using it for Pagesmith-specific setup, migration, and content-layer tasks.'

  const referenceHint =
    '\nFor package usage rules and full API/config details, read the package-shipped docs from node_modules:\n' +
    (profile === 'docs'
      ? '- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` — bootstrap/retrofit prompt for docs integration\n' +
        '- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` — bootstrap/retrofit prompt for the shared site toolkit under docs\n' +
        '- `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md` — site package usage contract\n' +
        '- `node_modules/@pagesmith/site/REFERENCE.md` — site CLI, preset, JSX, CSS/runtime, and SSG reference\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` — bootstrap/retrofit prompt for content-layer integrations\n' +
        '- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/docs-guidelines.md` — docs package usage guidance\n' +
        '- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/markdown-guidelines.md` — supported markdown features for docs projects\n' +
        '- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/usage.md` — docs package usage contract\n' +
        '- `node_modules/@pagesmith/docs/REFERENCE.md` — docs config, CLI, content structure, layout overrides\n' +
        '- `node_modules/@pagesmith/docs/schemas/*.schema.json` — version-matched schemas for config, meta.json5, and docs frontmatter; when `pagesmith.config.json5` is at the repo root, keep `$schema` pointing at `./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md` — core package workflow guidance\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md` — supported markdown features for content projects\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md` — core package usage contract\n' +
        '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown pipeline, and content-layer integration'
      : '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` — bootstrap/retrofit prompt for content-layer integrations\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/core-guidelines.md` — core package workflow guidance\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/markdown-guidelines.md` — supported markdown features for content projects\n' +
        '- `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/usage.md` — core package usage contract\n' +
        '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown pipeline, and content-layer integration')

  return [
    `# ${PAGESMITH_TITLE}`,
    '',
    renderSharedOverview(),
    ...(profile === 'docs' ? ['', renderDocsOverview()] : []),
    commandHint,
    referenceHint,
    '',
    '## Quick Start — @pagesmith/core',
    '',
    renderCoreQuickStart(),
    ...(profile === 'docs'
      ? ['', '## Quick Start — @pagesmith/docs', '', renderDocsQuickStart()]
      : []),
  ].join('\n')
}
