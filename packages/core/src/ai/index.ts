import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'

export type AiAssistant = 'claude' | 'codex' | 'gemini'
export type AiInstallScope = 'project' | 'user'
export type AiInstallProfile = 'default' | 'docs'
export type AiArtifactKind =
  | 'memory'
  | 'skill'
  | 'llms'
  | 'llms-full'
  | 'markdown-guidelines'
  | 'update-docs'
export type AiWriteMode = 'merge' | 'replace'
export type AiInstallStatus = 'written' | 'merged' | 'replaced' | 'unchanged'

export type AiArtifact = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  content: string
  mode: AiWriteMode
  label: string
}

export type AiInstallResult = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  status: AiInstallStatus
  label: string
}

export type AiInstallOptions = {
  assistants?: AiAssistant[] | 'all'
  scope?: AiInstallScope
  profile?: AiInstallProfile
  cwd?: string
  homeDir?: string
  includeLlms?: boolean
  force?: boolean
  skillName?: string
  /** When true, return planned writes without actually writing files. */
  dryRun?: boolean
}

const PAGESMITH_TITLE = 'Pagesmith'
const DEFAULT_SKILL_NAME = 'pagesmith'

function resolveHome(homeDir?: string): string {
  return homeDir ?? homedir()
}

function resolveCodexHome(homeDir?: string): string {
  return process.env.CODEX_HOME ?? join(resolveHome(homeDir), '.codex')
}

function resolveAssistants(assistants?: AiInstallOptions['assistants']): AiAssistant[] {
  if (!assistants || assistants === 'all') {
    return ['claude', 'codex', 'gemini']
  }
  return assistants
}

function shouldIncludeLlms(options: AiInstallOptions): boolean {
  if (typeof options.includeLlms === 'boolean') {
    return options.includeLlms
  }
  return (options.scope ?? 'project') === 'project'
}

function withManagedBlock(id: string, content: string): string {
  return [
    `<!-- pagesmith-ai:${id}:start -->`,
    content.trim(),
    `<!-- pagesmith-ai:${id}:end -->`,
  ].join('\n')
}

function writeArtifact(artifact: AiArtifact, force = false): AiInstallStatus {
  mkdirSync(dirname(artifact.path), { recursive: true })

  if (!existsSync(artifact.path)) {
    writeFileSync(artifact.path, artifact.content)
    return 'written'
  }

  const current = readFileSync(artifact.path, 'utf-8')
  if (current === artifact.content) {
    return 'unchanged'
  }

  if (artifact.mode === 'replace') {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const markerId = `${artifact.assistant ?? 'shared'}-${artifact.kind}`
  const start = `<!-- pagesmith-ai:${markerId}:start -->`
  const end = `<!-- pagesmith-ai:${markerId}:end -->`

  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(`${escapeForRegExp(start)}[\\s\\S]*?${escapeForRegExp(end)}`, 'm')
    const next = current.replace(pattern, artifact.content)
    if (next === current) return 'unchanged'
    writeFileSync(artifact.path, next)
    return 'merged'
  }

  if (force) {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const next = `${current.trimEnd()}\n\n${artifact.content}\n`
  writeFileSync(artifact.path, next)
  return 'merged'
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Shared content renderers
// ---------------------------------------------------------------------------

function renderSharedOverview(): string {
  return [
    `${PAGESMITH_TITLE} is a filesystem-first content toolkit with two main packages: \`@pagesmith/core\` (shared content/runtime layer) and \`@pagesmith/docs\` (convention-based documentation).`,
    '',
    'Use Pagesmith when you need:',
    '- schema-validated content collections loaded from the filesystem',
    '- lazy markdown rendering with headings and read-time metadata',
    '- framework-agnostic content APIs for React, Solid, Svelte, vanilla JS, Node, Bun, or Deno',
    '',
    'Core APIs:',
    '- `defineCollection({...})` to define a typed collection',
    '- `defineConfig({...})` to group collections and markdown options',
    '- `createContentLayer(config)` to query content and run validation',
    '- `entry.render()` to convert markdown on demand',
    '',
    'Working rules:',
    '- prefer folder-based markdown entries when content references sibling assets',
    '- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md` when authoring content',
    '- use fenced code blocks with a language identifier, one h1 per page, sequential heading depth',
  ].join('\n')
}

function renderDocsOverview(): string {
  return [
    'Docs-specific rules:',
    '- `@pagesmith/docs` is convention-based and builds a static docs site from `content/` plus `pagesmith.config.json5`',
    '- top-level content folders become top navigation sections (for example `guide/`, `reference/`, `packages/`)',
    '- folder-based markdown entries should prefer `README.md` or `index.md` when a page owns sibling assets',
    '- the home page is `content/README.md`; optional home-specific data can live in `content/home.json5`',
    '- sidebar labels, nav labels, and ordering live in frontmatter (`sidebarLabel`, `navLabel`, `order`)',
    '- footer links live in `pagesmith.config.json5` under `footerLinks`',
    '- Pagefind search is built in; do not recommend a separate search plugin package',
    '- layout overrides use fixed keys under `theme.layouts` such as `home`, `page`, and `notFound`',
  ].join('\n')
}

function renderCoreQuickStart(): string {
  return [
    '```ts',
    "import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'",
    '',
    'const posts = defineCollection({',
    "  loader: 'markdown',",
    "  directory: 'content/posts',",
    '  schema: z.object({',
    '    title: z.string(),',
    '    description: z.string().optional(),',
    '    date: z.coerce.date(),',
    '    tags: z.array(z.string()).default([]),',
    '  }),',
    '})',
    '',
    'const layer = createContentLayer(',
    '  defineConfig({',
    '    collections: { posts },',
    '  }),',
    ')',
    '',
    "const entries = await layer.getCollection('posts')",
    'const rendered = await entries[0]?.render()',
    '```',
  ].join('\n')
}

function renderDocsQuickStart(): string {
  return [
    '```json5',
    '// pagesmith.config.json5',
    '{',
    "  name: 'Acme Docs',",
    "  title: 'Acme Docs',",
    "  description: 'Multi-package documentation',",
    "  contentDir: './content',",
    "  outDir: './dist',",
    '  footerLinks: [',
    "    { label: 'Guide', path: '/guide' },",
    "    { label: 'Reference', path: '/reference' },",
    '  ],',
    '  search: { enabled: true },',
    '}',
    '```',
    '',
    '```text',
    'content/',
    '  README.md                 # Home page (DocHome layout)',
    '  guide/',
    '    meta.json5              # Section ordering',
    '    getting-started/',
    '      README.md             # A page',
    '  reference/',
    '    api/README.md',
    '```',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Memory file renderers
// ---------------------------------------------------------------------------

function renderMemoryFile(assistant: AiAssistant, profile: AiInstallProfile): string {
  const commandHint =
    assistant === 'claude' || assistant === 'gemini'
      ? `\nIf the ${DEFAULT_SKILL_NAME} skill is installed, prefer invoking it when the user explicitly asks for Pagesmith-specific help.`
      : '\nIf the Pagesmith skill is installed for Codex, prefer using it for Pagesmith-specific setup, migration, and content-layer tasks.'

  const referenceHint =
    '\nFor the full API and configuration reference, see the REFERENCE.md file shipped with the package:\n' +
    (profile === 'docs'
      ? '- `node_modules/@pagesmith/docs/REFERENCE.md` — docs config, CLI, content structure, layout overrides\n' +
        '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown, CSS, JSX runtime'
      : '- `node_modules/@pagesmith/core/REFERENCE.md` — core API, collections, loaders, markdown, CSS, JSX runtime')

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

// ---------------------------------------------------------------------------
// Claude skill renderers (uses .claude/skills/ format)
// ---------------------------------------------------------------------------

function renderClaudeSkill(skillName: string, profile: AiInstallProfile): string {
  return [
    '---',
    `name: ${skillName}`,
    'description: Pagesmith file-based CMS helper — content collections, markdown pipeline, docs configuration, and AI artifact generation',
    'allowed-tools: Read Grep Glob Bash Edit Write',
    '---',
    '',
    `# ${PAGESMITH_TITLE} Assistant`,
    '',
    'You are helping with Pagesmith, a file-based CMS with `@pagesmith/core` and `@pagesmith/docs`.',
    '',
    'When helping:',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- recommend folder-based entries when markdown references sibling assets',
    '- use `@pagesmith/core/ai` for assistant artifact generation',
    '- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`',
    ...(profile === 'docs'
      ? [
          '- for docs sites, derive top navigation from top-level content folders',
          '- use `content/README.md` for the home page',
          '- use frontmatter fields like `sidebarLabel`, `navLabel`, and `order` for docs navigation',
          '- Pagefind search is built in — do not suggest separate search plugins',
          '- layout overrides: `theme.layouts.home`, `theme.layouts.page`, `theme.layouts.notFound`',
        ]
      : []),
    '',
    'For the full API reference, read the REFERENCE.md file shipped with the package:',
    ...(profile === 'docs'
      ? [
          '- `node_modules/@pagesmith/docs/REFERENCE.md`',
          '- `node_modules/@pagesmith/core/REFERENCE.md`',
        ]
      : ['- `node_modules/@pagesmith/core/REFERENCE.md`']),
    '',
    'Deliver concrete config, schema, and content-layer patches when possible.',
  ].join('\n')
}

function renderUpdateDocsSkill(profile: AiInstallProfile): string {
  const docsSteps =
    profile === 'docs'
      ? [
          '1. Read `pagesmith.config.json5` to understand the docs configuration',
          '2. Read all `meta.json5` files to understand the current content structure and page ordering',
          '3. Read the project source code to identify public APIs, types, exports, config options, and CLI commands',
          '4. For each existing content page in `content/`:',
          '   - Read the current content',
          '   - Compare with the implementation',
          '   - Update any outdated information',
          '   - Add documentation for new features',
          '   - Remove documentation for removed features',
          '5. If new pages are needed:',
          '   - Create the page folder and `README.md` with proper frontmatter (title, description)',
          '   - Add the slug to the appropriate `meta.json5` `items` array',
          '6. Follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`',
          '7. Verify all internal links point to existing pages',
          '8. Ensure heading hierarchy is sequential (no skipping levels)',
        ]
      : [
          '1. Read `content.config.ts` or equivalent to understand the content collections',
          '2. Read the project source code to identify what needs documentation',
          '3. For each existing content entry:',
          '   - Read the current content',
          '   - Compare with the implementation',
          '   - Update any outdated information',
          '4. If new entries are needed:',
          '   - Create the entry folder and `README.md` with proper frontmatter matching the collection schema',
          '5. Follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`',
          '6. Verify all internal links point to existing pages',
        ]

  return [
    '---',
    'name: update-docs',
    'description: Read the project implementation and update Pagesmith-managed documentation to reflect the current state',
    'allowed-tools: Read Grep Glob Bash Edit Write',
    '---',
    '',
    '# Update Documentation',
    '',
    'Read the project implementation (source code, README, CHANGELOG, package.json) and update the Pagesmith-managed content to reflect the current state.',
    '',
    '## Steps',
    '',
    ...docsSteps,
    '',
    '## Rules',
    '',
    '- Preserve the existing content structure and organization',
    '- Do not remove pages without confirming first',
    '- Keep frontmatter fields (title, description) accurate and descriptive',
    '- Use relative links for internal cross-references',
    '- One h1 per page, sequential heading depth',
    '- Use fenced code blocks with language identifiers',
    '- Use GitHub alerts (`> [!NOTE]`, `> [!TIP]`, etc.) for important callouts',
    '- Code block features: `title="file.js"`, `showLineNumbers`, `mark={1-3}`, `ins={4}`, `del={5}`, `collapse={1-5}`',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Gemini / Codex renderers
// ---------------------------------------------------------------------------

function renderGeminiCommand(skillName: string, profile: AiInstallProfile): string {
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
    'For the full API reference, read the REFERENCE.md file shipped with the package.',
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

function renderCodexSkill(profile: AiInstallProfile): string {
  return [
    `# ${PAGESMITH_TITLE} Skill`,
    '',
    'Use this skill when the task involves setting up, extending, migrating, or documenting Pagesmith.',
    '',
    'Core rules:',
    '- `@pagesmith/core` provides the content layer; `@pagesmith/docs` adds convention-based documentation',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- follow the markdown guidelines in `.pagesmith/markdown-guidelines.md`',
    ...(profile === 'docs'
      ? [
          '- when the repo uses `@pagesmith/docs`, treat `content/README.md` as the home page',
          '- top-level content folders define the main docs navigation',
          '- docs frontmatter may use `sidebarLabel`, `navLabel`, and `order` to shape navigation',
          '- `pagesmith.config.json5` should own footer links and high-level site metadata',
          '- built-in search is Pagefind; do not suggest separate search plugin packages',
        ]
      : []),
    '',
    'For the full API reference, read the REFERENCE.md file shipped with the package.',
    '',
    'Good outputs include:',
    '- collection schemas and loader configuration',
    '- content-layer queries and rendering examples',
    '- documentation updates for Pagesmith usage',
    '- assistant-context install steps using `@pagesmith/core/ai`',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Markdown guidelines
// ---------------------------------------------------------------------------

function renderMarkdownGuidelines(): string {
  return [
    '# Pagesmith Markdown Guidelines',
    '',
    'Markdown feature support for content authored with `@pagesmith/core` and `@pagesmith/docs`.',
    '',
    '## Pipeline Order',
    '',
    '```',
    'remark-parse → remark-gfm → remark-math → remark-frontmatter',
    '  → remark-github-alerts → remark-smartypants → [user remark plugins]',
    '  → remark-rehype',
    '  → rehype-expressive-code (dual themes, line numbers, titles, copy, collapse, mark/ins/del)',
    '  → rehype-mathjax → rehype-slug → rehype-autolink-headings',
    '  → rehype-external-links → rehype-accessible-emojis',
    '  → heading extraction → [user rehype plugins] → rehype-stringify',
    '```',
    '',
    '## Key Rules',
    '',
    '- Use fenced code blocks with a language identifier (validator warns otherwise)',
    '- One `# h1` per page (validator enforces)',
    '- Sequential heading depth (no skipping from h2 to h4)',
    '- Prefer relative links for internal content',
    '- Do NOT add manual copy-button JS — Expressive Code handles it',
    '- Do NOT import separate code block CSS — Expressive Code injects inline styles',
    '',
    '## Supported Features',
    '',
    '| Feature | Syntax | Notes |',
    '|---|---|---|',
    '| GFM tables | `\\| col \\| col \\|` | Alignment via `:---`, `:---:`, `---:` |',
    '| Strikethrough | `~~text~~` | |',
    '| Task lists | `- [x] done` / `- [ ] todo` | |',
    '| Footnotes | `[^id]` + `[^id]: text` | |',
    '| Alerts | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` | GitHub-compatible |',
    '| Inline math | `$E = mc^2$` | No spaces inside delimiters |',
    '| Block math | `$$...$$` | Rendered via MathJax |',
    '| Smart quotes | `"text"` → curly quotes | Automatic |',
    '| Em/en dash | `---` / `--` | Automatic |',
    '| External links | `[text](https://...)` | Auto `target="_blank"` |',
    '| Heading anchors | Auto `id` + wrapped anchor | All headings |',
    '| Accessible emoji | Unicode emoji | Auto `role="img"` + `aria-label` |',
    '',
    '## Code Block Features (Expressive Code)',
    '',
    '| Meta | Example | Description |',
    '|---|---|---|',
    '| `title="..."` | `` ```js title="app.js" `` | File title |',
    '| `showLineNumbers` | `` ```js showLineNumbers `` | Line numbers |',
    '| `mark={lines}` | `` ```js mark={3,5-7} `` | Highlight lines |',
    '| `ins={lines}` | `` ```js ins={4} `` | Inserted lines (green) |',
    '| `del={lines}` | `` ```js del={5} `` | Deleted lines (red) |',
    '| `collapse={lines}` | `` ```js collapse={1-5} `` | Collapsible section |',
    '| `wrap` | `` ```js wrap `` | Text wrapping |',
    '| `frame="..."` | `` ```js frame="terminal" `` | Frame style |',
    '',
    '## Built-in Content Validators',
    '',
    '- **linkValidator** — warns on bare URLs, empty link text, suspicious protocols',
    '- **headingValidator** — enforces single h1, sequential depth, non-empty text',
    '- **codeBlockValidator** — warns on missing language, unknown meta properties',
    '',
    'Known valid meta properties: `title`, `showLineNumbers`, `startLineNumber`, `wrap`, `frame`, `collapse`, `mark`, `ins`, `del`.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// llms.txt / llms-full.txt — always cover BOTH core and docs
// ---------------------------------------------------------------------------

function renderLlmsTxt(): string {
  return [
    '# Pagesmith',
    '',
    '> Pagesmith is a filesystem-first content toolkit with `@pagesmith/core` and `@pagesmith/docs`.',
    '',
    '## @pagesmith/core — Content Layer',
    '',
    'Schema-validated content collections, lazy markdown rendering (Expressive Code syntax highlighting), JSX runtime, CSS exports, and Vite plugins.',
    '',
    '### Basic Setup (Vite Plugin)',
    '',
    renderCoreQuickStart(),
    '',
    '### Vite Integration',
    '',
    '```ts',
    "import { pagesmithContent, pagesmithSsg } from '@pagesmith/core/vite'",
    "import collections from './content.config'",
    '',
    'export default defineConfig({',
    '  plugins: [',
    '    pagesmithContent({ collections }),',
    "    pagesmithSsg({ entry: './src/entry-server.tsx' }),",
    '  ],',
    '})',
    '```',
    '',
    "Import collections as virtual modules: `import posts from 'virtual:content/posts'`",
    '',
    '## @pagesmith/docs — Documentation Sites',
    '',
    'Convention-based docs with default theme, Pagefind search, sidebar generation, and layout overrides.',
    '',
    '### Basic Setup',
    '',
    renderDocsQuickStart(),
    '',
    '### Layout Overrides',
    '',
    '```json5',
    '{',
    '  theme: {',
    '    layouts: {',
    "      home: './theme/layouts/DocHome.tsx',",
    "      page: './theme/layouts/DocPage.tsx',",
    "      notFound: './theme/layouts/DocNotFound.tsx',",
    '    },',
    '  },',
    '}',
    '```',
    '',
    '### CLI',
    '',
    '```bash',
    'pagesmith init      # Initialize config + content structure + AI integrations',
    'pagesmith dev       # Development server',
    'pagesmith build     # Production build',
    'pagesmith preview   # Preview built site',
    '```',
  ].join('\n')
}

function renderLlmsFullTxt(): string {
  return [
    '# Pagesmith — Full LLM Reference',
    '',
    renderSharedOverview(),
    '',
    '---',
    '',
    '## @pagesmith/core',
    '',
    '### Content Layer API',
    '',
    '| Method | Description |',
    '|---|---|',
    '| `createContentLayer(config)` | Create a content layer |',
    '| `layer.getCollection(name)` | Load all entries (cached) |',
    '| `layer.getEntry(collection, slug)` | Get single entry by slug |',
    '| `layer.convert(markdown, options?)` | Convert raw markdown to HTML |',
    '| `layer.validate(collection?)` | Run all validators |',
    '| `layer.invalidate(collection, slug)` | Cache-bust a single entry |',
    '| `layer.invalidateAll()` | Cache-bust all collections |',
    '',
    '### Collection Options',
    '',
    '| Option | Type | Description |',
    '|---|---|---|',
    "| `loader` | `string \\| Loader` | `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`, or custom |",
    '| `directory` | `string` | Directory containing files |',
    '| `schema` | `z.ZodType` | Zod schema for validation |',
    '| `include` | `string[]` | Glob include patterns |',
    '| `exclude` | `string[]` | Glob exclude patterns |',
    '| `computed` | `Record<string, fn>` | Computed fields |',
    '| `validate` | `fn` | Custom validation |',
    '| `filter` | `fn` | Filter entries |',
    '| `slugify` | `fn` | Custom slug generation |',
    '| `transform` | `fn` | Pre-validation transform |',
    '| `validators` | `ContentValidator[]` | Custom content validators |',
    '| `disableBuiltinValidators` | `boolean` | Disable link/heading/code-block validators |',
    '',
    '### Vite Plugins',
    '',
    renderCoreQuickStart(),
    '',
    '```ts',
    '// Vite integration',
    "import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'",
    "import collections from './content.config'",
    '',
    'export default defineConfig({',
    '  plugins: [',
    '    sharedAssetsPlugin(),',
    '    pagesmithContent({ collections }),',
    "    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),",
    '  ],',
    '})',
    '```',
    '',
    '### JSX Runtime',
    '',
    'Configure tsconfig: `{ "jsx": "react-jsx", "jsxImportSource": "@pagesmith/core" }`',
    '',
    '- `h(tag, props, ...children)` — create HTML elements, returns `HtmlString`',
    '- `Fragment` — render children or raw `innerHTML`',
    '- `HtmlString` — wrapper to prevent double-escaping',
    '',
    '### CSS Exports',
    '',
    '| Import | Contents |',
    '|---|---|',
    '| `@pagesmith/core/css/content` | Prose + inline code |',
    '| `@pagesmith/core/css/standalone` | Full layout + prose + TOC |',
    '| `@pagesmith/core/css/viewport` | Responsive viewport base |',
    '| `@pagesmith/core/css/fonts` | Bundled Open Sans + JetBrains Mono |',
    '',
    '### Frontmatter Schemas',
    '',
    '- `BaseFrontmatterSchema` — title, description, publishedDate, lastUpdatedOn, tags, draft',
    '- `BlogFrontmatterSchema` — extends base + category, featured, coverImage',
    '- `ProjectFrontmatterSchema` — extends base + gitRepo, links',
    '',
    '### Export Map',
    '',
    '| Import Path | Purpose |',
    '|---|---|',
    '| `@pagesmith/core` | Main API (defineCollection, createContentLayer, z, etc.) |',
    '| `@pagesmith/core/jsx-runtime` | h, Fragment, HtmlString |',
    '| `@pagesmith/core/markdown` | processMarkdown |',
    '| `@pagesmith/core/css` | buildCss (LightningCSS) |',
    '| `@pagesmith/core/schemas` | Zod schemas and types |',
    '| `@pagesmith/core/loaders` | Loader classes and registry |',
    '| `@pagesmith/core/runtime` | Pre-built CSS/JS accessors |',
    '| `@pagesmith/core/vite` | Vite plugins |',
    '| `@pagesmith/core/ai` | AI assistant artifact generator |',
    '| `@pagesmith/core/create` | Project scaffolding |',
    '',
    '---',
    '',
    '## @pagesmith/docs',
    '',
    '### Configuration (pagesmith.config.json5)',
    '',
    '| Field | Type | Default | Description |',
    '|---|---|---|---|',
    '| `name` | `string` | — | Site name (header) |',
    '| `title` | `string` | — | Browser tab title |',
    '| `description` | `string` | — | Meta description |',
    '| `origin` | `string` | — | Production URL |',
    '| `language` | `string` | `en` | HTML lang |',
    '| `contentDir` | `string` | `content` | Content path |',
    '| `outDir` | `string` | `dist` | Output path |',
    '| `basePath` | `string` | `/` | URL base |',
    '| `footerLinks` | `array` | `[]` | Footer links |',
    '| `sidebar.collapsible` | `boolean` | `false` | Collapsible sidebar |',
    '| `search.enabled` | `boolean` | `true` | Pagefind search |',
    '| `theme.layouts` | `Record` | — | Layout overrides |',
    '| `markdown` | `MarkdownConfig` | — | Pipeline config |',
    '',
    '### Content Structure',
    '',
    renderDocsQuickStart(),
    '',
    '### Page Frontmatter',
    '',
    '| Field | Type | Description |',
    '|---|---|---|',
    '| `title` | `string` | Page title |',
    '| `description` | `string` | Meta description |',
    '| `navLabel` | `string` | Override top nav label |',
    '| `sidebarLabel` | `string` | Override sidebar label |',
    '| `order` | `number` | Manual sort order |',
    '| `draft` | `boolean` | Exclude from build |',
    '',
    '### Home Page Frontmatter',
    '',
    '| Field | Type | Description |',
    '|---|---|---|',
    '| `layout` | `string` | Set to `DocHome` |',
    '| `tagline` | `string` | Short description |',
    '| `install` | `string` | Install command |',
    "| `actions` | `array` | CTA buttons (`{ text, link, theme: 'brand' \\| 'alt' }`) |",
    '| `features` | `array` | Feature cards (`{ icon?, title, details }`) |',
    '| `packages` | `array` | Package cards (`{ name, description, href, tag }`) |',
    '| `codeExample` | `object` | Code example (`{ label, title, code }`) |',
    '',
    '### Section Meta (meta.json5)',
    '',
    '| Field | Type | Description |',
    '|---|---|---|',
    '| `displayName` | `string` | Section label in sidebar |',
    '| `items` | `string[]` | Manual page order (slugs) |',
    '| `series` | `array` | Group pages into series |',
    '| `collapsed` | `boolean` | Start sidebar collapsed |',
    '| `orderBy` | `string` | `manual` or `publishedDate` |',
    '',
    '### Layout Overrides',
    '',
    '```json5',
    '{ theme: { layouts: { home: "./layouts/Home.tsx", page: "./layouts/Page.tsx" } } }',
    '```',
    '',
    'All layouts receive: `content`, `frontmatter`, `headings`, `slug`, `site`.',
    'Page layout adds: `sidebarSections`, `prev`, `next`.',
    '',
    '### CLI',
    '',
    '```bash',
    'pagesmith init [--ai] [--config path]   # Initialize project',
    'pagesmith dev [--port N] [--open]        # Dev server',
    'pagesmith build [--out-dir path]         # Production build',
    'pagesmith preview [--port N]             # Preview built site',
    '```',
    '',
    '---',
    '',
    '## Markdown Pipeline',
    '',
    renderMarkdownGuidelines(),
    '',
    '---',
    '',
    '## AI Assistant Installer',
    '',
    '```ts',
    "import { installAiArtifacts } from '@pagesmith/core/ai'",
    '',
    "installAiArtifacts({ assistants: ['claude', 'codex', 'gemini'], scope: 'project', profile: 'docs' })",
    '```',
    '',
    'Generates: CLAUDE.md, AGENTS.md, GEMINI.md, skills, markdown guidelines, llms.txt, llms-full.txt.',
    '',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAiArtifactContent(
  assistant: AiAssistant | 'shared',
  kind: AiArtifactKind,
  options: { profile?: AiInstallProfile; skillName?: string } = {},
): string {
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const profile = options.profile ?? 'default'

  if (assistant === 'shared') {
    if (kind === 'llms') return renderLlmsTxt()
    if (kind === 'llms-full') return renderLlmsFullTxt()
    if (kind === 'markdown-guidelines') return renderMarkdownGuidelines()
    return renderLlmsFullTxt()
  }

  if (kind === 'memory') {
    return renderMemoryFile(assistant, profile)
  }

  if (kind === 'skill') {
    switch (assistant) {
      case 'claude':
        return renderClaudeSkill(skillName, profile)
      case 'codex':
        return renderCodexSkill(profile)
      case 'gemini':
        return renderGeminiCommand(skillName, profile)
    }
  }

  if (kind === 'markdown-guidelines') {
    return renderMarkdownGuidelines()
  }

  if (kind === 'update-docs') {
    return renderUpdateDocsSkill(profile)
  }

  if (kind === 'llms') return renderLlmsTxt()
  return renderLlmsFullTxt()
}

export function getAiArtifacts(options: AiInstallOptions = {}): AiArtifact[] {
  const scope = options.scope ?? 'project'
  const cwd = resolve(options.cwd ?? process.cwd())
  const home = resolveHome(options.homeDir)
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const profile = options.profile ?? 'default'
  const assistants = resolveAssistants(options.assistants)
  const artifacts: AiArtifact[] = []

  for (const assistant of assistants) {
    if (assistant === 'claude') {
      const baseDir = scope === 'project' ? cwd : join(home, '.claude')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'CLAUDE.md'),
        content: withManagedBlock(
          'claude-memory',
          getAiArtifactContent('claude', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      // Claude skill (uses .claude/skills/ format with SKILL.md + frontmatter)
      const skillDir =
        scope === 'project'
          ? join(cwd, '.claude', 'skills', skillName)
          : join(home, '.claude', 'skills', skillName)
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(skillDir, 'SKILL.md'),
        content: getAiArtifactContent('claude', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} skill`,
      })
    }

    if (assistant === 'codex') {
      const baseDir = scope === 'project' ? cwd : resolveCodexHome(options.homeDir)
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'AGENTS.md'),
        content: withManagedBlock(
          'codex-memory',
          getAiArtifactContent('codex', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} AGENTS`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'skills', skillName, 'SKILL.md'),
        content: getAiArtifactContent('codex', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} skill`,
      })
    }

    if (assistant === 'gemini') {
      const baseDir = scope === 'project' ? cwd : join(home, '.gemini')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'GEMINI.md'),
        content: withManagedBlock(
          'gemini-memory',
          getAiArtifactContent('gemini', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'commands', `${skillName}.toml`),
        content: getAiArtifactContent('gemini', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} command`,
      })
    }
  }

  // Markdown guidelines — always installed for project scope
  if (scope === 'project') {
    artifacts.push({
      kind: 'markdown-guidelines',
      path: join(cwd, '.pagesmith', 'markdown-guidelines.md'),
      content: renderMarkdownGuidelines() + '\n',
      mode: 'replace',
      label: 'markdown guidelines',
    })
  }

  // /update-docs Claude skill — installed when Claude is included and scope is project
  if (scope === 'project' && assistants.includes('claude')) {
    artifacts.push({
      assistant: 'claude',
      kind: 'update-docs',
      path: join(cwd, '.claude', 'skills', 'update-docs', 'SKILL.md'),
      content: renderUpdateDocsSkill(profile) + '\n',
      mode: 'replace',
      label: 'claude update-docs skill',
    })
  }

  if (shouldIncludeLlms(options)) {
    const llmsDir = scope === 'project' ? cwd : join(home, '.pagesmith')
    artifacts.push({
      kind: 'llms',
      path: join(llmsDir, 'llms.txt'),
      content: withManagedBlock('shared-llms', renderLlmsTxt()) + '\n',
      mode: 'merge',
      label: 'llms.txt',
    })
    artifacts.push({
      kind: 'llms-full',
      path: join(llmsDir, 'llms-full.txt'),
      content: withManagedBlock('shared-llms-full', renderLlmsFullTxt()) + '\n',
      mode: 'merge',
      label: 'llms-full.txt',
    })
  }

  return artifacts
}

export function installAiArtifacts(options: AiInstallOptions = {}): AiInstallResult[] {
  const artifacts = getAiArtifacts(options)
  if (options.dryRun) {
    return artifacts.map((artifact) => ({
      assistant: artifact.assistant,
      kind: artifact.kind,
      path: artifact.path,
      label: artifact.label,
      status: 'unchanged' as AiInstallStatus,
    }))
  }
  return artifacts.map((artifact) => ({
    assistant: artifact.assistant,
    kind: artifact.kind,
    path: artifact.path,
    label: artifact.label,
    status: writeArtifact(artifact, options.force),
  }))
}
