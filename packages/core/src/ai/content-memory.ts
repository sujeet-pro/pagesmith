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
      ? '- `node_modules/@pagesmith/docs/docs/agents/usage.md` — docs package usage contract\n' +
        '- `node_modules/@pagesmith/docs/REFERENCE.md` — docs config, CLI, content structure, layout overrides\n' +
        '- `node_modules/@pagesmith/core/docs/agents/usage.md` — core package usage contract\n' +
        '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown, CSS, JSX runtime'
      : '- `node_modules/@pagesmith/core/docs/agents/usage.md` — core package usage contract\n' +
        '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown, CSS, JSX runtime')

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
