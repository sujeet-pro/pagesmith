import type { AiInstallProfile } from './types'
import { PAGESMITH_TITLE } from './content-shared'

export function renderGeminiCommand(skillName: string, profile: AiInstallProfile): string {
  const prompt = [
    `You are helping with ${PAGESMITH_TITLE}, a file-based CMS with @pagesmith/core and @pagesmith/docs.`,
    '',
    'Focus on concrete, implementation-ready help:',
    '- design collections with defineCollection',
    '- configure createContentLayer and defineConfig',
    '- prefer folder-based markdown entries when local assets sit beside content',
    '- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`',
    ...(profile === 'docs'
      ? [
          '- for docs sites, follow the convention-based `content/` structure',
          '- drive top navigation from top-level folders and use frontmatter for labels/order',
          '- keep Pagefind as the built-in search strategy',
        ]
      : []),
    '',
    'For package usage guidance and full API reference, read:',
    ...(profile === 'docs'
      ? [
          '- `node_modules/@pagesmith/docs/docs/agents/usage.md`',
          '- `node_modules/@pagesmith/docs/REFERENCE.md`',
          '- `node_modules/@pagesmith/core/docs/agents/usage.md`',
          '- `node_modules/@pagesmith/core/REFERENCE.md`',
        ]
      : [
          '- `node_modules/@pagesmith/core/docs/agents/usage.md`',
          '- `node_modules/@pagesmith/core/REFERENCE.md`',
        ]),
    '',
    'Return code, config, or documentation-ready guidance instead of vague summaries.',
  ].join('\n')

  return [
    `description = "Pagesmith FS-CMS helper"`,
    'prompt = """',
    prompt,
    '"""',
    '',
    `# Installed as /${skillName}`,
  ].join('\n')
}
