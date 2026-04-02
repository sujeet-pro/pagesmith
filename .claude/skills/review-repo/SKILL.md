---
name: review-repo
description: Full repository review using parallel agent teams — covers code quality, tests, architecture, performance, security, docs, CLAUDE.md alignment, and open-source best practices — with actionable fix plan
user_invocable: true
arguments:
  - name: scope
    description: 'Review scope: full, code, tests, docs, security, performance, packages, claude-md (default: full)'
    required: false
  - name: fix
    description: 'Auto-fix after review: true, false (default: false — asks for confirmation)'
    required: false
---

# Repository Review

Perform an exhaustive review of the pagesmith repository to ensure production readiness, open-source best practices, and alignment across code, tests, docs, and CLAUDE.md instructions.

This review uses an **agentic team architecture** — multiple specialized agents run in parallel to maximize review throughput and depth. The review covers the multi-package workspace (`@pagesmith/core`, `@pagesmith/docs`, plugins, `@pagesmith/create`) plus the docs site, examples, and assistant context files.

## Review Scope

When `scope=full` (default), run ALL sections below using the full agent team. When a specific scope is given, run only the relevant agent(s) plus the synthesis/plan/fix steps.

## Review Workflow

### Step 1: Gather Context (Orchestrator)

Before launching the review team, the orchestrator gathers the current project state by running validation commands:

```bash
# Build and validate — run these sequentially, record pass/fail for each
vp check
vp test run
node --experimental-strip-types scripts/build-packages.ts
npm audit --audit-level=moderate
```

Record which commands pass and which fail. Failures become critical findings passed to all agents as context.

Also run:

```bash
npm run build:docs
```

Capture this output as shared context for the agent team.

### Step 2: Launch Agent Team (Parallel)

Launch **5 specialized review agents in parallel** using the Agent tool. Each agent receives the shared context from Step 1 and focuses on its assigned review sections. All agents run concurrently for maximum speed.

**IMPORTANT**: Use a single message with multiple Agent tool calls to launch all 5 agents simultaneously. Each agent should use `subagent_type: "code-reviewer"` for code-focused reviews or `subagent_type: "general-purpose"` for broader reviews. Name each agent for addressability.

#### Agent 1: `code-quality-agent` (Sections 1 + 3 + 4)

**Scope**: Code quality, architecture, and performance across all packages.

**Prompt template**:

```
You are reviewing the pagesmith multi-package workspace for code quality, architecture, and performance.

Shared context (validation results):
{paste Step 1 output}

Review the following and report ALL findings in structured format.

SECTION 1 — CODE QUALITY: Review all source files in packages/core/src/, packages/docs/src/, packages/docs/schemas/, packages/docs/cli/, packages/docs/theme/. Check ESM/TS conventions, cross-package import consistency, error handling patterns, Zod schema correctness, unified markdown pipeline, LightningCSS builder, JSX runtime (h/Fragment/HtmlString).

SECTION 3 — ARCHITECTURE: Review module boundaries and cross-package design:
- Content layer: collections, loaders (JSON, JSON5, JSONC, YAML, TOML, Markdown), store, content-layer API (defineCollection, createContentLayer)
- Markdown pipeline: unified chain (remark-parse → remark-gfm → remark-math → remark-frontmatter → rehype → shiki → rehype-code-tabs), heading extraction, processor caching
- JSX runtime: h(), Fragment, HtmlString, document rendering
- CSS builder: LightningCSS bundling, token system, light-dark() usage
- Layout engine: multi-directory resolution, propsSchema exports
- SSG pipeline: 3-phase build (process markdown → render pages → generate assets), worker pool (pool.ts serialization with Map→Record for postMessage)
- Cross-package: schemas in docs/schemas/ align with types in core/src/schemas/, re-export correctness (docs/src/jsx-runtime/ → @pagesmith/core/jsx-runtime)
- Dependency graph: core standalone, docs depends on core, plugins peer with docs

SECTION 4 — PERFORMANCE: Review for:
- Markdown processor caching (WeakMap per MarkdownConfig) in pipeline.ts
- Content store in-memory caching and invalidation
- Worker pool concurrency in SSG build
- LightningCSS bundling and CSS minification
- Rolldown JS bundling
- Asset hashing efficiency
- Entry loading parallelism (Promise.all vs sequential)
- Shiki highlighter initialization overhead

For EVERY issue found, output in this exact format:
- **[SEVERITY]** (critical/major/minor/info) **[CATEGORY]** (Code Quality/Architecture/Performance)
- **File**: path:line_number
- **Issue**: description
- **Fix**: how to fix it

Read the actual source files. Do not guess — verify claims against code.
```

#### Agent 2: `security-testing-agent` (Sections 2 + 5)

**Scope**: Testing coverage and security across all packages.

**Prompt template**:

```
You are reviewing the pagesmith repository for test coverage and security.

Shared context (validation results):
{paste Step 1 output}

SECTION 2 — TESTING: Review all test files in packages/core/src/__tests__/ and tests/e2e/. For each source module, check if its test file exists and covers: happy paths, error paths, edge cases.

Expected coverage by area:

Core tests (packages/core/src/__tests__/):
- frontmatter.test.ts — parsing, validation, edge cases
- loaders.test.ts — all loader types (JSON, JSON5, JSONC, YAML, TOML, Markdown)
- store.test.ts — collection loading, caching, invalidation, error recovery
- content-layer.test.ts — full pipeline integration, defineCollection, createContentLayer
- pipeline.test.ts — markdown rendering, heading extraction, code blocks, shiki
- validation-runner.test.ts — shared MDAST, error recovery, custom validators
- slug.test.ts — edge cases: README, index, nested, no extension

E2E tests (tests/e2e/):
- CLI commands (build, dev, preview, ai install)
- Content layer end-to-end (load, validate, render)
- Markdown rendering pipeline
- Validation pipeline
- SSG build pipeline

Missing coverage to flag:
- SSG build pipeline (process → render → generate)
- SSG generators (sitemap, RSS, redirects, tags, agents, manifest)
- SSG config loading and resolution
- Validators (links, headings, code blocks, assets, frontmatter, meta, orphans)
- Worker pool serialization
- Layout engine resolution
- CSS builder

SECTION 5 — SECURITY: Review for vulnerabilities:
- Markdown: allowDangerousHtml in remark-rehype and rehype-stringify — verify sanitization
- Content collector: file path handling, glob patterns — no path traversal
- JSON5/YAML/TOML parsing: prototype pollution, injection attacks
- CLI: argument injection in bin.ts
- SSG dev server: WebSocket, file serving, request validation
- Worker pool: postMessage data — no code injection
- Asset copier: symlink following, directory escape

For EVERY issue found, output in this exact format:
- **[SEVERITY]** (critical/major/minor/info) **[CATEGORY]** (Testing/Security)
- **File**: path:line_number
- **Issue**: description
- **Fix**: how to fix it

Read the actual test files and source code. Check what IS tested, and flag what is NOT tested.
```

#### Agent 3: `claude-md-skills-agent` (Sections 6 + 7)

**Scope**: CLAUDE.md alignment and skills review.

**Prompt template**:

```
You are reviewing the pagesmith repository's CLAUDE.md files and skills for accuracy and alignment with the actual codebase.

Shared context (validation results):
{paste Step 1 output}

SECTION 6 — CLAUDE.md ALIGNMENT: There are two CLAUDE.md files: root and packages/core/CLAUDE.md. Read both and verify EVERY claim against the actual code:

Root CLAUDE.md:
- Package descriptions — verify each @pagesmith/* package exists and matches description
- Dependency graph — verify actual dependencies in each package.json
- Repo layout — for EVERY listed directory, verify it EXISTS. Flag any that exist but are NOT listed.
- Commands — verify every CLI command works (vp check, vp test, pagesmith build, pagesmith dev, etc.)
- Guidance — verify recommendations match actual APIs (defineCollection, defineConfig, createContentLayer)
- Configuration format — verify core uses pagesmith.config.ts and docs uses pagesmith.config.json5

packages/core/CLAUDE.md (if exists):
- Directory structure — verify every listed file exists
- Export tables — verify against actual package.json exports map
- API functions — verify against actual src/index.ts exports
- Coding conventions — spot-check source files

SECTION 7 — SKILLS REVIEW: Read every skill in .claude/skills/. For each:
- Verify CLI commands shown actually work
- Verify API examples use correct function signatures
- Verify config examples match current schema
- Check consistency across skills (terminology, code style)
- Verify skill cross-references

For EVERY issue found, output in this exact format:
- **[SEVERITY]** (critical/major/minor/info) **[CATEGORY]** (CLAUDE.md/Skills)
- **File**: path:line_number
- **Issue**: description
- **Fix**: how to fix it

This agent must read CLAUDE.md files, all skill files, and cross-reference against actual source code. Do NOT guess — verify.
```

#### Agent 4: `docs-agent` (Section 8)

**Scope**: Documentation completeness and accuracy.

**Prompt template**:

```
You are reviewing the pagesmith documentation site (docs/) for completeness, accuracy, and quality.

Shared context (validation results):
{paste Step 1 output}

SECTION 8 — DOCUMENTATION: Review every file in docs/ against the actual codebase:

Guide pages (docs/guide/):
- getting-started.md — installation steps, prerequisites, first collection, content loading
- ai-assistants.md — Claude, Codex, Gemini CLI setup, skill installation
- examples.md — example walkthroughs, code accuracy

Reference pages (docs/reference/):
- api.md — all public functions with full signatures, parameters, return types
- architecture.md — content layer design, markdown pipeline, JSX runtime, CSS builder, layout engine
- runtime.md — runtime JS (copy-code, theme toggle, TOC highlight), CSS loading

Pagesmith docs config (docs/pagesmith.config.json5 if exists) — nav links, sidebar, no broken links

llms.txt and llms-full.txt:
- Verify alignment with current API and behavior
- Verify all listed functions are actually exported
- Verify all listed CLI commands work
- Verify package names and descriptions match

Examples (examples/):
- shared-content/ — content.config.ts correctness, tsconfig, dependencies
- with-react/ — vite-plugin-content.ts correctness, package.json, builds
- with-solid/ — same checks
- with-svelte/ — same checks
- with-vanilla-ejs/ — build.ts correctness, package.json
- with-vanilla-hbs/ — build.ts correctness, package.json
- blog-site/ — custom layout site using @pagesmith/core
- doc-site/ — convention-based docs using @pagesmith/docs

MISSING DOCUMENTATION — flag if any of these are missing or incomplete:
- Installation guide for all packages
- Content layer API guide (defineCollection, createContentLayer, loaders, validation)
- SSG build pipeline documentation
- Theme customization guide
- Plugin development guide
- Migration guide from other CMS tools
- llms.txt alignment with current API

For EVERY issue found, output in this exact format:
- **[SEVERITY]** (critical/major/minor/info) **[CATEGORY]** (Documentation)
- **File**: path:line_number (or "MISSING: filename" for missing docs)
- **Issue**: description
- **Fix**: how to fix it

Read the actual doc files and cross-reference against source code. Check that all code examples are correct.
```

#### Agent 5: `opensource-agent` (Section 9)

**Scope**: Open source best practices and packaging.

**Prompt template**:

```
You are reviewing the pagesmith repository for open-source best practices and npm packaging quality.

Shared context (validation results):
{paste Step 1 output}

SECTION 9 — OPEN SOURCE BEST PRACTICES:

Repository files — verify existence and quality of: README.md, LICENSE, CONTRIBUTING.md, CHANGELOG.md, CLAUDE.md, AGENTS.md, GEMINI.md, GUIDELINES.md, .github/ (issue templates, PR templates, CI workflows), .gitignore, .editorconfig, .node-version

Root package.json — verify:
- workspaces array matches actual packages/ and examples/ directories
- scripts (build, test, check, build:examples, build:docs)
- type: "module"
- devDependencies
- overrides (vite-plus)
- packageManager

Per-package package.json (5 packages) — for each package in packages/, verify:
- name (@pagesmith/* scope)
- version, description
- keywords (for npm search)
- repository, bugs, homepage
- license
- exports map correctness (entries match actual built files)
- files array (what gets published)
- bin entries (for packages with CLI — core, docs, create)
- dependencies vs peerDependencies (core standalone, docs depends on core, plugins peer with docs)
- engines.node if specified

packages/create/ (scaffolding):
- templates/ directory contains valid starter templates
- index.js works end-to-end (creates project, installs deps)
- Template content matches current API

Examples:
- Each example has correct dependencies on workspace packages
- Each example builds successfully
- package.json scripts are correct
- tsconfig.json is valid

npm pack verification — for each package:
- Only intended files are published (no test files, fixtures, configs)
- Types are included (*.d.ts or *.d.mts)
- Entry points resolve correctly
- No secrets or credentials in published files

README quality:
- Clear introduction explaining what pagesmith is
- Feature list
- Install instructions for each package
- Quick start example
- API overview
- Configuration overview
- Links to docs site
- Development setup
- License

GitHub templates:
- Issue templates (bug report, feature request)
- PR template
- CI workflows (lint, test, build, e2e)

For EVERY issue found, output in this exact format:
- **[SEVERITY]** (critical/major/minor/info) **[CATEGORY]** (Open Source)
- **File**: path or "MISSING: filename"
- **Issue**: description
- **Fix**: how to fix it

Read the actual files. Verify links. Check that instructions actually work.
```

### Step 3: Collect and Synthesize Agent Results (Orchestrator)

After all 5 agents complete, the orchestrator:

1. **Collects** all findings from every agent
2. **Deduplicates** findings that overlap between agents (e.g., both code-quality and docs agents may flag the same stale API reference)
3. **Prioritizes** by severity: critical > major > minor > info
4. **Groups** by fix phase (what can be fixed together)

### Step 4: Generate Report and Plan

Write two files using the synthesized findings from all agents:

---

## Review Section Details

The following sections define what each agent reviews. They are the checklists agents use during their analysis.

---

## Section 1: Code Quality

Review all source files in `packages/core/src/`, `packages/docs/src/`, `packages/docs/schemas/`, `packages/docs/cli/`, and `packages/docs/theme/` for:

### 1.1 ESM and TypeScript Conventions

- ESM-only (`import`/`export`, never `require`/`module.exports`)
- TypeScript strict mode compliance
- No `any` types unless absolutely necessary (and commented why)
- Trailing commas, no semicolons (per GUIDELINES.md)
- Section headers use `/* -- Name -- */` pattern
- Comments explain reasoning, not what code does

### 1.2 Error Handling

- Content store: per-entry catch, log warning with file path, continue loading rest of collection
- Loaders: `LoaderError` with file path, format, line/column context
- Validators: per-validator catch in runner, convert to validation issue
- SSG build: per-page catch in worker pool, log error, continue batch
- Dev server: graceful error pages, WebSocket reconnect
- Missing optional dependencies (sharp): warn once, skip gracefully
- No swallowed errors (empty catch blocks)
- No unhandled promise rejections
- Proper error messages (actionable, include context)

### 1.3 Cross-Package Import Consistency

- `@pagesmith/core` imports never reach into `@pagesmith/docs` internals
- `@pagesmith/docs` imports from `@pagesmith/core` only via public API (`src/index.ts` exports)
- No circular dependencies between packages
- Re-exports are correct: `docs/src/jsx-runtime/index.ts` re-exports from `@pagesmith/core/jsx-runtime`

### 1.4 Zod Schema Patterns

- All schemas use `z.object()` with proper field types
- `.optional()` vs `.default()` used correctly
- `.transform()` used for computed fields
- `safeParse` preferred over `parse` for user-facing validation
- Schema composition via `.extend()`, `.merge()`, `.pick()`, `.omit()`
- No duplicate schema definitions across packages (core schemas vs docs schemas)

### 1.5 Code Patterns

- Content layer: `defineCollection()` / `createContentLayer()` as primary API
- Markdown pipeline: unified chain assembled once per config, cached via WeakMap
- JSX runtime: `h()` / `Fragment` / `HtmlString` used consistently in layouts
- CSS builder: LightningCSS `transform()` / `bundle()` used correctly
- Layout engine: multi-directory resolution with correct precedence
- No dead code, unused imports, or unused variables
- Functions exported only if needed by other modules or public API

### 1.6 CLI Implementation

- Manual arg parsing is consistent and correct
- Error messages go to `console.error`, normal output to `console.log`
- Unknown commands produce helpful error messages
- `--help` and `--version` flags work correctly
- Exit codes: `0` for success, `1` for error
- Sub-commands: `build`, `dev`, `preview`, `ai install`

---

## Section 2: Testing Coverage

Review all test files in `packages/core/src/__tests__/` and `tests/e2e/` for:

### 2.1 Core Unit Test Coverage

For each module in `packages/core/src/`, verify corresponding test file exists and covers:

| Module | Expected Test Coverage |
| --- | --- |
| `frontmatter.ts` | Parsing valid/invalid YAML, missing frontmatter, type coercion, edge cases |
| `loaders/json.ts` | Valid JSON, JSON5, invalid input, large files |
| `loaders/jsonc.ts` | JSON with comments, nested comments, edge cases |
| `loaders/yaml.ts` | Valid YAML, multi-document, anchors, invalid input |
| `loaders/toml.ts` | Valid TOML, nested tables, arrays, invalid input |
| `loaders/markdown.ts` | Frontmatter extraction, content splitting, empty files |
| `store.ts` | Collection loading, caching, invalidation, error recovery per entry |
| `content-layer.ts` | Full pipeline: defineCollection, createContentLayer, getCollection, getEntry |
| `entry.ts` | Lazy rendering, read time computation, slug generation |
| `validation/runner.ts` | Shared MDAST tree, error recovery, custom validators |
| `validation/link-validator.ts` | Internal links, external links, anchors, broken links |
| `validation/heading-validator.ts` | Heading hierarchy, duplicate IDs, missing H1 |
| `validation/code-block-validator.ts` | Language tags, syntax validity |
| `schemas/collection.ts` | Collection schema validation, defaults, transforms |
| `utils/slug.ts` | README, index, nested paths, special characters, no extension |
| `utils/read-time.ts` | Word counting, code block exclusion, short/long content |
| `markdown/pipeline.ts` | Full rendering, heading extraction, code blocks, shiki highlighting |
| `css/builder.ts` | LightningCSS bundling, minification, custom properties |

### 2.2 E2E Test Coverage

Verify `tests/e2e/` tests cover:

| Scenario | Expected Coverage |
| --- | --- |
| CLI build | Full SSG build end-to-end, output correctness |
| CLI dev | Dev server starts, serves pages, hot reload |
| CLI preview | Preview server starts, serves built output |
| CLI ai install | Assistant context installation (Claude, Codex, Gemini) |
| Content loading | Collections load, validate, render correctly |
| Markdown rendering | Full pipeline: parse → transform → render → HTML output |
| Validation pipeline | All validators run, issues reported correctly |
| Config loading | JSON5 config, defaults, overrides |
| SSG generators | Sitemap, RSS, redirects, tags, manifest, not-found |
| Worker pool | Page rendering in parallel workers |
| Layout resolution | Multi-directory layout lookup, propsSchema |
| Error recovery | Malformed content, missing files, invalid config |

### 2.3 Test Quality

- Tests are deterministic (no flaky tests, no timing dependencies)
- Tests use isolated temp directories (cleaned up after)
- No tests export functions solely for testing (test through public interface)
- Assertions are specific (not just "truthy")
- Error paths are tested, not just happy paths
- Edge cases: empty files, very large files, unicode filenames, special characters

---

## Section 3: Architecture Review

### 3.1 Content Layer Design

- `defineCollection()` creates typed collection definitions with Zod schemas
- `createContentLayer()` initializes the content store from a config
- Loaders (JSON, JSON5, JSONC, YAML, TOML, Markdown) follow a common interface
- Content store manages loading, caching, validation, and computed fields
- Entries are lazy-rendered (markdown processed on first access)
- Slugs generated from file paths with configurable `slugify`

### 3.2 Markdown Pipeline

Verify the unified chain:

```
raw markdown → matter() (frontmatter extraction)
  → remarkParse → remarkGfm → remarkMath → remarkFrontmatter
  → remark-rehype (allowDangerousHtml)
  → rehype-shiki (syntax highlighting)
  → rehype-code-tabs (tabbed code blocks)
  → rehype-stringify
  → { html, headings, frontmatter }
```

- Processor cached per MarkdownConfig (WeakMap key)
- Heading extraction as side effect during processing
- Shiki themes and language aliases configurable
- Custom remark/rehype plugins supported

### 3.3 JSX Runtime

- `h(tag, props, ...children)` creates virtual DOM nodes
- `Fragment` for grouping without wrapper element
- `HtmlString` for safe raw HTML injection
- `renderToString()` converts virtual DOM to HTML string
- Used by all doc theme layouts and SSG document rendering

### 3.4 CSS Architecture

- LightningCSS for bundling, minification, and transforms
- Token system in `foundations/tokens.css` with CSS custom properties
- `light-dark()` function for theme-aware values
- Token alignment between `@pagesmith/core` styles and `@pagesmith/docs` theme styles
- Viewport-aware responsive design

### 3.5 Layout Engine

- Multi-directory resolution: theme layouts → user layouts → fallback
- Each layout exports a `default` render function and optional `propsSchema`
- `propsSchema` validates page data before rendering
- Layout names map to frontmatter `layout` field

### 3.6 SSG Pipeline

Verify the 3-phase build:

```
Phase 1: Process Markdown
  - Discover content files
  - Load and validate all collections
  - Render markdown to HTML (lazy, cached)

Phase 2: Render Pages
  - Resolve layout for each page
  - Validate page data against propsSchema
  - Render pages via worker pool (pool.ts)
  - Worker serialization: Map→Record for postMessage

Phase 3: Generate Assets
  - Run generators (sitemap, RSS, redirects, tags, agents, browserconfig, manifest-json, not-found)
  - Copy static assets with content hashing
  - Bundle CSS (LightningCSS) and JS (Rolldown)
  - Write output to dist/
```

### 3.7 Cross-Package Consistency

- Schemas in `packages/docs/schemas/` align with types in `packages/core/src/schemas/`
- No duplicate type definitions across packages
- Re-exports are correct and complete
- Dependency graph enforced: core → standalone, docs → core, plugins peer with docs

### 3.8 Configuration Flow

Verify config loading:

```
pagesmith.config.ts (core) or pagesmith.config.json5 (docs) → Zod validation → merged with defaults → resolved config
```

- Core uses `pagesmith.config.ts` (TypeScript), docs uses `pagesmith.config.json5` (JSON5)
- Defaults applied for missing fields
- Schema validation catches invalid config early
- CLI flags override config values

---

## Section 4: Performance Review

### 4.1 Markdown Processor Caching

- WeakMap keyed by MarkdownConfig object (reference equality)
- Processor chain built once per unique config
- Shiki highlighter initialized once per processor
- No cache invalidation needed (configs are immutable)

### 4.2 Content Store Caching

- Collections loaded once, cached in memory
- `getCollection()` returns cached data on subsequent calls
- `getEntry()` triggers full collection load on first call (documented behavior)
- Invalidation strategy for watch mode

### 4.3 Worker Pool Concurrency

- Worker pool for parallel page rendering in SSG build
- `Map→Record` serialization for postMessage (Maps are not structured-cloneable)
- Worker count based on available CPUs
- Error isolation: one worker failure doesn't crash the pool

### 4.4 CSS and JS Bundling

- LightningCSS: fast native bundling, minification, custom property resolution
- Rolldown: fast native JS bundling for runtime scripts
- Asset hashing for cache busting
- No unnecessary re-bundling

### 4.5 Entry Loading

- Parallel entry loading via `Promise.all` (or controlled concurrency for large collections)
- File I/O: `readFileSync` for content (blocking but fast for small files)
- Glob patterns for file discovery

### 4.6 Memory

- No memory leaks in dev server watch mode
- Content store doesn't grow unboundedly
- Worker pool properly cleans up
- Large markdown files don't cause OOM

---

## Section 5: Security Review

### 5.1 Markdown Input Sanitization

- `allowDangerousHtml` in remark-rehype: verify what user HTML is allowed through
- rehype-stringify: verify sanitization of output HTML
- Script injection via markdown content
- XSS vectors in frontmatter values rendered into HTML

### 5.2 Content Collector File Safety

- File path handling: no path traversal via crafted file names
- Glob patterns: no escape from content directory
- Symlink handling: don't follow symlinks outside project
- Directory traversal via `../` in content paths

### 5.3 Data Format Parsing

- JSON5 parsing: prototype pollution via `__proto__`, `constructor`
- YAML parsing: prototype pollution, code execution via `!!js/function`
- TOML parsing: large nested structures, memory exhaustion
- Frontmatter parsing: same YAML risks

### 5.4 CLI Security

- Argument injection in `bin.ts`
- Shell command construction (if any)
- File path arguments: sanitization before use


### 5.5 SSG Dev Server

- WebSocket: origin validation, no arbitrary message handling
- File serving: no directory traversal, only serve from project root
- Request validation: method, path, content-type
- No sensitive file exposure (config, .env, credentials)

### 5.6 Worker Pool

- postMessage data: only serializable data, no code injection
- Worker scripts: loaded from trusted paths only
- Error messages: no sensitive data leaked

### 5.7 Dependencies

- No known vulnerabilities (`npm audit` results from shared context)
- Optional peer dependencies dynamically imported (sharp)
- No unnecessary runtime dependencies
- Lock file integrity

---

## Section 6: CLAUDE.md Alignment

Compare every claim in CLAUDE.md files against the actual codebase:

### 6.1 Root CLAUDE.md

Verify every claim:

- Package list — verify each `@pagesmith/*` package exists at stated path
- Package descriptions — verify each matches actual package purpose
- Dependency graph — verify against actual `package.json` dependencies/peerDependencies
- Repo layout — for EVERY listed directory, verify it EXISTS. Flag any that exist but are NOT listed.
- Repo workflow — verify `vp install`, `vp check`, `vp test` work
- Useful commands — verify each listed command works
- Configuration format — verify core uses `pagesmith.config.ts` and docs uses `pagesmith.config.json5`
- Guidance — verify recommendations match actual API

### 6.2 Package-level CLAUDE.md (packages/core/CLAUDE.md)

If exists, verify:

- Directory structure matches actual files
- Export tables match actual `package.json` exports
- API functions match actual `src/index.ts` exports
- Coding conventions are followed in source

### 6.3 Orphan Detection

Flag entries in any CLAUDE.md that reference:

- Files that don't exist
- Functions that aren't exported
- CLI commands that don't work
- Configuration options that aren't implemented
- Dependencies that aren't in package.json
- Packages that don't exist

### 6.4 Missing Information

Flag if CLAUDE.md is missing:

- New files/modules that exist but aren't documented
- New CLI commands not listed
- New API functions not listed
- Changed configuration options

---

## Section 7: Skills Review

Review all skills in `.claude/skills/` for:

### 7.1 Accuracy

For each skill file:

- All CLI commands shown actually work
- All API examples use correct function signatures
- All configuration examples match current schema
- File paths referenced actually exist

### 7.2 Completeness

- All CLI commands documented in at least one skill
- All major API functions referenced where relevant
- Error scenarios and troubleshooting covered

### 7.3 Consistency

- Terminology consistent across skills
- Code examples use consistent style
- Skill frontmatter follows standard format

---

## Section 8: Documentation Review

Review all docs in `docs/` for:

### 8.1 Guide Pages (`docs/guide/`)

- **getting-started.md** — installation, prerequisites, first collection, content loading example
- **ai-assistants.md** — Claude Code, Codex, Gemini CLI setup, skill installation, verification
- **examples.md** — example walkthroughs, code accuracy, links to example directories

### 8.2 Reference Pages (`docs/reference/`)

- **api.md** — every exported function with full signature, parameters, return types, examples
- **architecture.md** — content layer, markdown pipeline, JSX runtime, CSS builder, layout engine, SSG pipeline
- **runtime.md** — runtime JS modules, CSS loading, theme toggle, copy-code, TOC highlight

### 8.3 Root Documentation (`docs/index.md`)

- Landing page accurate and up to date
- Links to guide and reference pages work
- Feature overview matches actual capabilities

### 8.4 llms.txt and llms-full.txt

- Package names and descriptions match actual packages
- API functions listed are actually exported
- CLI commands listed actually work
- Configuration options match current schema
- Architecture description matches current code

### 8.5 Examples Accuracy

For each example in `examples/`:

- `package.json` dependencies are correct and versions match workspace
- `tsconfig.json` is valid
- Build scripts work (`build.ts` or `vite.config.ts`)
- Content config (`content.config.ts`) uses correct API
- Vite plugin (`vite-plugin-content.ts`) is correct where applicable

### 8.6 Docs Configuration (@pagesmith/docs)

- `pagesmith.config.json5` is valid
- Navigation links work
- Sidebar structure matches actual pages
- No broken links

### 8.7 Missing Documentation

Flag if any of these are missing or incomplete:

- Content layer API guide (defineCollection, createContentLayer, loaders, validation)
- SSG build pipeline documentation
- Theme customization guide
- Plugin development guide (pagefind, algolia)
- Layout authoring guide
- Migration guide from Astro/Contentlayer/Velite
- Contributing guide (CONTRIBUTING.md)
- Changelog (CHANGELOG.md)

---

## Section 9: Open Source Best Practices

### 9.1 Repository Files

Verify existence and quality of:

| File | Status | Notes |
| --- | --- | --- |
| `README.md` | Required | Clear intro, install, quick start, API overview |
| `LICENSE` | Required | MIT license present and correct |
| `CONTRIBUTING.md` | Required | Dev setup, test running, PR process |
| `CHANGELOG.md` | Required | Version history with dates |
| `CLAUDE.md` | Project | Architecture guide for LLM assistants |
| `AGENTS.md` | Project | Codex assistant context |
| `GEMINI.md` | Project | Gemini CLI assistant context |
| `GUIDELINES.md` | Project | Coding conventions and implementation guide |
| `.github/` | Required | Issue templates, PR templates, CI workflows |
| `.gitignore` | Required | Covers node_modules, dist, etc. |
| `.editorconfig` | Recommended | Consistent formatting across editors |
| `.node-version` | Required | Specifies Node version |
| `package.json` | Required | Complete workspace config |

### 9.2 Root Package.json

Verify:

- `workspaces` array matches actual `packages/` and `examples/` directories
- `scripts` include: build, build:examples, build:docs, test, check, check:fix
- `type: "module"`
- `devDependencies` are minimal (TypeScript, vite-plus)
- `overrides` for vite-plus
- `packageManager` specified

### 9.3 Per-Package Package.json

For each of the packages (`core`, `docs`, `plugin-pagefind`, `plugin-algolia`, `create`), verify:

- `name` uses `@pagesmith/` scope
- `version`, `description` present
- `keywords` for npm search
- `repository`, `bugs`, `homepage`
- `license`
- `exports` map entries match actual built files
- `files` array limits what's published
- `bin` entry for packages with CLI (`core`, `docs`, `create`)
- Dependencies follow the graph: core standalone, docs→core, plugins peer with docs
- `engines.node` if specified

### 9.4 Scaffolding Package (`packages/create/`)

- `index.js` creates a working project
- Templates in `templates/` are valid and use current API
- Template `package.json` has correct dependencies
- Template content files use correct frontmatter and schema format

### 9.5 npm Publishing

For each package:

- `npm pack --dry-run` shows only intended files
- No test files, fixtures, or config files in the package
- Types are included (`*.d.ts` or `*.d.mts`)
- Entry points resolve correctly
- No secrets or credentials in published files
- No postinstall scripts that execute arbitrary code

### 9.6 GitHub Templates

Check `.github/` for:

- Issue templates (bug report, feature request)
- PR template
- CI workflows (lint, test, build, e2e)
- Dependabot or Renovate config

---

## Step 4 (continued): Generate Report and Plan

After synthesizing findings from all agents, write two files:

### Report File

Write the full report to `.temp/review-repo-report.md`:

```markdown
# Repository Review Report

Generated: {date}
Scope: {scope}
Agents: 5 parallel review agents

## Agent Status

| Agent | Sections | Status | Findings |
| --- | --- | --- | --- |
| code-quality-agent | 1, 3, 4 | completed | X issues |
| security-testing-agent | 2, 5 | completed | X issues |
| claude-md-skills-agent | 6, 7 | completed | X issues |
| docs-agent | 8 | completed | X issues |
| opensource-agent | 9 | completed | X issues |

## Summary

| Category | Critical | Major | Minor | Info |
| --- | --- | --- | --- | --- |
| Code Quality | X | X | X | X |
| Testing | X | X | X | X |
| Architecture | X | X | X | X |
| Performance | X | X | X | X |
| Security | X | X | X | X |
| CLAUDE.md | X | X | X | X |
| Skills | X | X | X | X |
| Documentation | X | X | X | X |
| Open Source | X | X | X | X |
| **Total** | **X** | **X** | **X** | **X** |

## Findings

### Critical Issues

{list of critical issues with file:line, description, fix, and source agent}

### Major Issues

{list of major issues with source agent}

### Minor Issues

{list of minor issues with source agent}

### Info/Observations

{list of observations with source agent}

## Fix Plan

### Phase 1: Critical Fixes

{ordered list of changes}

### Phase 2: Major Fixes

{ordered list of changes}

### Phase 3: Minor Improvements

{ordered list of changes}
```

### Plan File

Write the actionable fix plan to `.temp/review-repo-plan.md`:

```markdown
# Fix Plan

## Phase 1: Critical Fixes (must fix before release)

1. {description} — {file(s)} — {what to change}
2. ...

## Phase 2: Major Fixes (should fix)

1. {description} — {file(s)} — {what to change}
2. ...

## Phase 3: Minor Improvements (nice to have)

1. {description} — {file(s)} — {what to change}
2. ...

## Validation

After applying fixes, run:
\`\`\`bash
vp check && vp test run
\`\`\`
```

---

## Step 5: Ask for Approval

Present the report summary to the user:

```
Repository review complete.

5 agents reviewed 9 sections in parallel.
Found: X critical, Y major, Z minor issues.

Report: .temp/review-repo-report.md
Plan: .temp/review-repo-plan.md

Would you like me to fix these issues? (y/n)
- Fix all: Apply all phases
- Fix critical only: Apply Phase 1 only
- Fix critical + major: Apply Phases 1 and 2
- Review first: Open the plan for manual review
```

If `fix=true` was passed as an argument, skip the confirmation and proceed directly to fixing.

---

## Step 6: Apply Fixes (Agent Team — Phase-based)

When approved, launch fix agents in parallel per phase. Each fix phase can use multiple agents working on independent files simultaneously.

### Fix Phase Strategy

For each approved phase, group fixes by independence (files that don't overlap can be fixed in parallel):

#### Phase 1 Fix Team (Critical)

Launch agents in parallel for independent critical fixes:

- **Agent A**: Code fixes (`packages/core/src/` changes — one agent per independent module)
- **Agent B**: Docs package fixes (`packages/docs/` — if independent of core changes)
- **Agent C**: Doc/config fixes (CLAUDE.md, skills, docs — if independent of code changes)
- **Agent D**: Test fixes (test files — if independent of code changes)

If fixes are interdependent (e.g., core API change requires docs update and example update), run them sequentially within a single agent.

#### Phase 2 Fix Team (Major)

Same parallel strategy as Phase 1, but for major fixes. Only launched after Phase 1 passes validation.

#### Phase 3 Fix Team (Minor)

Same parallel strategy, only if user approved "Fix all". Only launched after Phase 2 passes validation.

### Validation Between Phases

After EACH fix phase completes (all agents in that phase finish):

```bash
vp check --fix       # Auto-fix formatting
vp check             # Verify lint/type checks
vp test run          # Verify all tests pass
node --experimental-strip-types scripts/build-packages.ts  # Verify build succeeds
```

If any validation step fails:

1. Do NOT proceed to the next phase
2. Launch a **fix-validation-agent** to diagnose and fix the failure
3. Re-run validation
4. Only proceed when all checks pass

After ALL approved phases complete:

```bash
vp check && vp test run && node --experimental-strip-types scripts/build-packages.ts
```

Report final status to the user.

---

## Agent Team Summary

| Agent | Role | Sections | Runs In |
| --- | --- | --- | --- |
| **Orchestrator** (main) | Gathers context, launches team, synthesizes results, manages fix phases | All | Foreground |
| `code-quality-agent` | Code quality + architecture + performance review | 1, 3, 4 | Parallel (background) |
| `security-testing-agent` | Testing coverage + security review | 2, 5 | Parallel (background) |
| `claude-md-skills-agent` | CLAUDE.md alignment + skills accuracy | 6, 7 | Parallel (background) |
| `docs-agent` | Documentation completeness + accuracy | 8 | Parallel (background) |
| `opensource-agent` | Open source best practices + packaging | 9 | Parallel (background) |
| Fix agents (Phase 1-3) | Apply approved fixes in parallel per phase | — | Parallel per phase |
| `fix-validation-agent` | Diagnose and fix validation failures between phases | — | On-demand |

### Scoped Review Agent Mapping

When `scope` is not `full`, only launch the relevant agents:

| Scope | Agents Launched |
| --- | --- |
| `full` | All 5 review agents |
| `code` | `code-quality-agent` only (Sections 1, 3, 4) |
| `tests` | `security-testing-agent` only (Section 2 only) |
| `security` | `security-testing-agent` only (Section 5 only) |
| `performance` | `code-quality-agent` only (Section 4 only) |
| `docs` | `docs-agent` only (Section 8) |
| `claude-md` | `claude-md-skills-agent` only (Section 6 only) |
| `packages` | `code-quality-agent` (cross-package focus from Section 3) + `opensource-agent` (Section 9) |

---

## Composability

This skill is standalone. Invoke it with `/review-repo` for a full repository audit. It can be scoped to specific areas (e.g., `/review-repo scope=docs`) for targeted reviews.

The review is non-destructive by default — it only reads code and writes to `.temp/`. Fixes are only applied after explicit user approval.

### Integration with Other Skills

- After fixes are applied, run `/review-repo scope=code` for a focused re-check
- Documentation fixes can be validated with `npm run build:docs`
- Use `vp check && vp test run` for quick validation between manual changes
