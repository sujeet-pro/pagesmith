# Implementation Guidelines: Performance & Architecture Improvements

Actionable implementation guide for all changes identified in the multi-model code review (Gemini, Claude Sonnet, Claude Opus). Organized by priority and execution order. Each item includes the exact files, line numbers, what to change, and why.

---

## Phase 1: Critical Fixes (P0)

### 1.1 Eliminate Triple MDAST Parsing in Validators

**Problem**: Each of the 3 built-in validators independently parses the markdown to MDAST via `unified().use(remarkParse).parse()`. For every markdown entry, the same content is parsed 3 times.

**Files**:
- `packages/core/src/validation/types.ts` (line 11-22) — add `mdast` to context
- `packages/core/src/validation/runner.ts` (line 23-44) — parse once before loop
- `packages/core/src/validation/link-validator.ts` (line 70) — use pre-parsed tree
- `packages/core/src/validation/heading-validator.ts` (line 58) — use pre-parsed tree
- `packages/core/src/validation/code-block-validator.ts` (line 81) — use pre-parsed tree

**Changes**:

1. Add `mdast` field to `ValidatorContext` in `types.ts`:

```typescript
import type { Root } from 'mdast'

export type ValidatorContext = {
  filePath: string
  slug: string
  collection: string
  rawContent?: string
  data: Record<string, any>
  /** Pre-parsed MDAST tree. Shared across all validators to avoid re-parsing. */
  mdast?: Root
}
```

2. Parse once in `runner.ts` before the validator loop:

```typescript
import remarkParse from 'remark-parse'
import { unified } from 'unified'

export async function runValidators(
  ctx: ValidatorContext,
  validators: ContentValidator[],
): Promise<ValidationIssue[]> {
  // Parse MDAST once, share across all validators
  if (ctx.rawContent && !ctx.mdast) {
    ctx.mdast = unified().use(remarkParse).parse(ctx.rawContent)
  }

  const issues: ValidationIssue[] = []
  for (const validator of validators) {
    try {
      const result = await validator.validate(ctx)
      issues.push(...result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      issues.push({
        message: `Validator "${validator.name}" threw: ${message}`,
        severity: 'error',
      })
    }
  }
  return issues
}
```

3. In each validator, use `ctx.mdast` instead of parsing:

```typescript
// link-validator.ts line 70 — replace:
const tree = unified().use(remarkParse).parse(ctx.rawContent) as MdastNode
// with:
const tree = ctx.mdast as MdastNode
```

Same pattern for `heading-validator.ts` line 58 and `code-block-validator.ts` line 81.

4. Remove `import remarkParse from 'remark-parse'` and `import { unified } from 'unified'` from each individual validator since they no longer parse.

**Impact**: 3x reduction in markdown parsing during validation. Measured in terms of unified parser initialization, remark tokenization, and AST construction.

---

### 1.2 Fix Double Schema Validation

**Problem**: In `store.ts`, Zod `safeParse` runs twice per entry — once at line 108 via `validateSchema()` for error reporting, and again at line 138 for data coercion. Both calls do the same work.

**File**: `packages/core/src/store.ts` (lines 107-139)

**Change**: Replace the two calls with a single `safeParse`, extract both errors and coerced data from one result:

```typescript
// Replace lines 107-139 with:

// Single Zod parse — extracts both issues and coerced data
const parseResult = def.schema.safeParse(raw.data)

const issues: ValidationIssue[] = parseResult.success
  ? []
  : (parseResult.error as import('zod').ZodError).issues.map((issue) => ({
      field: issue.path.length > 0 ? formatPath(issue.path) : undefined,
      message: issue.message,
      severity: 'error' as const,
    }))

// Custom validation
if (def.validate) {
  const customError = def.validate(raw)
  if (customError) {
    issues.push({ message: customError, severity: 'error' })
  }
}

// Run content validators on markdown entries
const isMarkdownEntry = raw.content !== undefined
if (isMarkdownEntry) {
  const validators = this.resolveValidators(def)
  if (validators.length > 0) {
    const contentIssues = await runValidators(
      { filePath, slug, collection: collectionName, rawContent: raw.content, data: raw.data },
      validators,
    )
    issues.push(...contentIssues)
  }
}

const validatedData = parseResult.success ? parseResult.data : raw.data
```

This requires moving `formatPath` from `schema-validator.ts` to a shared location, or importing it. Alternatively, keep `validateSchema` but make it return `{ issues, data }` instead of just issues.

**Also**: Remove the now-unnecessary `validateSchema` import if it's fully replaced, or refactor `validateSchema` to return the coerced data alongside issues:

```typescript
// schema-validator.ts — new signature
export function validateSchema(data: Record<string, any>, schema: ZodType): {
  issues: ValidationIssue[]
  validatedData: any
} {
  const result = schema.safeParse(data)
  if (result.success) return { issues: [], validatedData: result.data }
  return {
    issues: (result.error as ZodError).issues.map((issue) => ({
      field: issue.path.length > 0 ? formatPath(issue.path) : undefined,
      message: issue.message,
      severity: 'error' as const,
    })),
    validatedData: data,
  }
}
```

---

### 1.3 Wire Plugin System or Remove Dead Code

**Problem**: `ContentPlugin` is defined in `schemas/config.ts` (lines 41-49) with `rehypePlugin`, `remarkPlugin`, and `validate` hooks. Helper functions exist in `plugins/index.ts` (`collectRemarkPlugins`, `collectRehypePlugins`, `runPluginValidators`). But none of these are called from `store.ts` or `entry.ts`. The plugin system is dead code.

**Files**:
- `packages/core/src/schemas/config.ts` (lines 37-49) — plugin type definition
- `packages/core/src/plugins/index.ts` (lines 1-31) — helper functions
- `packages/core/src/store.ts` — needs plugin integration
- `packages/core/src/entry.ts` — needs plugin integration for rendering

**Option A (recommended): Wire plugins into the pipeline**:

1. In `store.ts` `loadEntry()`, after running content validators, run plugin validators:

```typescript
// After line 134 in store.ts:
if (this.config.plugins?.length) {
  const { runPluginValidators } = await import('./plugins/index.js')
  const pluginIssues = runPluginValidators(this.config.plugins, {
    data: raw.data,
    content: raw.content,
  })
  for (const msg of pluginIssues) {
    issues.push({ message: msg, severity: 'error' })
  }
}
```

2. In `entry.ts` `render()`, pass plugin remark/rehype extensions to `processMarkdown`:

```typescript
// The MarkdownConfig type already supports remarkPlugins and rehypePlugins.
// When constructing the ContentEntry, merge plugin extensions into the markdown config.
```

This requires threading `config.plugins` to the ContentEntry, or merging them into `markdownConfig` at construction time in `store.ts`.

**Option B: Remove dead code** — delete `plugins/index.ts`, `plugins/types.ts`, and the `plugins` field from `ContentPlugin` and `ContentLayerConfig`. Add back when actually implementing.

---

### 1.4 Fix JsonLoader / JsoncLoader Overlap

**Problem**: `JsonLoader` declares `extensions = ['.json', '.json5', '.jsonc']` (json.ts line 13), and it parses `.jsonc` files via JSON5. But `JsoncLoader` also handles `.jsonc` (jsonc.ts line 54) with a different strategy (comment stripping + strict `JSON.parse`). The `resolveLoader` function routes `'jsonc'` to `JsoncLoader` while `'json'` routes to `JsonLoader` — but `JsonLoader.extensions` still includes `.jsonc`, causing confusion about which handles what.

**File**: `packages/core/src/loaders/json.ts` (line 13)

**Change**: Remove `.jsonc` from `JsonLoader.extensions`:

```typescript
export class JsonLoader implements Loader {
  name = 'json'
  extensions = ['.json', '.json5']
  // ...
}
```

This makes `JsoncLoader` the sole handler for `.jsonc` files. The separation is clean: `JsonLoader` handles strict JSON and JSON5 superset, `JsoncLoader` handles JSON with comments (strict JSON + comment stripping).

---

## Phase 2: Performance Improvements (P1)

### 2.1 Cache the Unified Markdown Processor

**Problem**: `processMarkdown()` in `pipeline.ts` builds an entirely new unified processor chain on every call. This includes initializing all remark/rehype plugins and — most expensively — the Expressive Code highlighter. For a site with 100 markdown entries, this creates 100 separate processor instances.

**File**: `packages/core/src/markdown/pipeline.ts`

**Change**: Cache the processor keyed by a config reference. The current implementation uses a WeakMap keyed on the config object reference, which avoids per-call processor creation.

```typescript
// Already implemented in pipeline.ts:
const processorCache = new WeakMap<MarkdownConfig, ReturnType<typeof createProcessor>>()

function createProcessor(config: MarkdownConfig): ReturnType<typeof unified> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkFrontmatter, ['yaml'])

  // ... rest of current pipeline setup (lines 60-101)

  return processor
}

export async function processMarkdown(
  raw: string,
  config: MarkdownConfig = {},
): Promise<MarkdownResult> {
  const { data: frontmatter, content } = matter(raw)
  const headings: Heading[] = []

  const key = configKey(config)
  let processor = processorCache.get(key)
  if (!processor) {
    processor = createProcessor(config)
    processorCache.set(key, processor)
  }

  const result = await processor.process(content)
  return { html: String(result), headings, frontmatter }
}
```

**Note**: The heading extraction plugin has side effects (pushes to a mutable array). This needs to be handled per-call. Either extract headings separately after processing, or use a vfile-based approach.

**Consideration**: If `MarkdownConfig` includes user plugins that are closures, `JSON.stringify` won't capture identity. For the common case (same config object reused across a collection), reference equality on the config object itself works as a cache key:

```typescript
const processorCache = new WeakMap<MarkdownConfig, ReturnType<typeof unified>>()
```

---

### 2.2 Parallelize Entry Loading

**Problem**: `store.ts` `loadCollection()` (lines 59-64) processes entries sequentially in a for-of loop. Each iteration awaits `loadEntry()` before starting the next.

**File**: `packages/core/src/store.ts` (lines 57-64)

**Change**: Use `Promise.all` for parallelism. Loaders use `readFileSync` so they're effectively sync, but validators and transforms can be async:

```typescript
const entries = new Map<string, CacheEntry>()
const results = await Promise.all(
  files.map((filePath) => this.loadEntry(name, filePath, directory, loader, def)),
)
for (const result of results) {
  if (result) entries.set(result.entry.slug, result)
}
```

If FS pressure is a concern for very large collections (1000+), use controlled concurrency:

```typescript
// p-limit or manual chunking
import pLimit from 'p-limit'
const limit = pLimit(16) // 16 concurrent entries
const results = await Promise.all(
  files.map((filePath) => limit(() => this.loadEntry(name, filePath, directory, loader, def))),
)
```

Adding `p-limit` as a dependency is optional — `Promise.all` without limiting is sufficient for the target use case (blog/doc sites with <500 entries).

---

### 2.3 Optimize getEntry to Avoid Loading Full Collection

**Problem**: `content-layer.ts` `getEntry()` (lines 81-88) calls `getCollection()` which loads ALL entries just to find one by slug.

**File**: `packages/core/src/content-layer.ts` (lines 81-88)

**Current behavior is acceptable** because `getCollection()` is cached (second call is a no-op returning cached data). The issue only matters for the very first call. However, document this clearly:

```typescript
async getEntry<S extends z.ZodType>(
  collection: string,
  slug: string,
): Promise<ContentEntry<z.infer<S>> | undefined> {
  // First call loads the full collection (cached for subsequent calls).
  // Single-entry loading is not supported because validation and computed
  // fields may depend on the full collection context.
  await this.getCollection(collection)
  return this.store.getEntry(collection, slug)
}
```

**Future optimization**: If a `getEntry` path without full collection load is needed (e.g., for live/on-demand mode), add a `ContentStore.loadSingleEntry()` method that bypasses computed fields and cross-entry validators.

---

## Phase 3: Code Quality (P1-P2)

### 3.1 Compute Read Time from Raw Markdown, Not HTML

**Problem**: `computeReadTime()` in `read-time.ts` (lines 8-15) strips HTML tags with regex (`/<[^>]+>/g`), which breaks on edge cases like attributes containing `>`, `<script>` content, etc.

**File**: `packages/core/src/utils/read-time.ts`

**Change**: Compute from raw markdown text instead of rendered HTML. This is more accurate anyway — code blocks, frontmatter, and HTML elements shouldn't count toward reading time:

```typescript
export function computeReadTime(rawMarkdown: string): number {
  // Strip code blocks (fenced and indented)
  const withoutCode = rawMarkdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^( {4}|\t).+$/gm, '')
  // Strip frontmatter
  const withoutFrontmatter = withoutCode.replace(/^---[\s\S]*?---/m, '')
  // Strip HTML tags
  const withoutHtml = withoutFrontmatter.replace(/<[^>]+>/g, ' ')
  // Strip markdown syntax (links, images, emphasis, headings)
  const plainText = withoutHtml
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = plainText.split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}
```

**Also update the call site** in `entry.ts` line 66 to pass `this.rawContent` instead of `result.html`:

```typescript
const readTime = computeReadTime(this.rawContent)
```

---

### 3.2 Remove .d.ts Files from src/

**Problem**: Files like `packages/core/src/convert.d.ts`, `document.d.ts`, `frontmatter.d.ts`, `layout-engine.d.ts`, `toc.d.ts` and their `.d.ts.map` counterparts are checked into `src/`. These are either generated artifacts that should live in `dist/` and be gitignored, or unnecessary given the `.ts` sources.

**Files**: All `.d.ts` and `.d.ts.map` files under `packages/core/src/`

**Change**:
1. Delete all `.d.ts` and `.d.ts.map` files from `packages/core/src/`
2. Add to `.gitignore`: `*.d.ts` and `*.d.ts.map` (at package level if needed)
3. Ensure the Vite build generates declarations into `dist/`

---

### 3.3 Add Error Boundary for Individual Entry Loading

**Problem**: A single malformed content file (bad YAML frontmatter, corrupt JSON, etc.) crashes the entire collection load. The `loadEntry` method doesn't catch loader errors.

**File**: `packages/core/src/store.ts` (lines 59-64)

**Change**: Wrap `loadEntry` in try/catch and convert to a validation issue instead of crashing:

```typescript
for (const filePath of files) {
  try {
    const result = await this.loadEntry(name, filePath, directory, loader, def)
    if (result) entries.set(result.entry.slug, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const slug = def.slugify ? def.slugify(filePath, directory) : toSlug(filePath, directory)
    const entry = new ContentEntry(slug, name, filePath, {}, undefined, markdownConfig)
    entries.set(slug, {
      entry,
      issues: [{ message: `Failed to load: ${message}`, severity: 'error' }],
    })
  }
}
```

This ensures one bad file doesn't prevent the rest of the collection from loading.

---

## Phase 4: Architecture & DX (P2)

### 4.1 Structured Loader Errors

**Problem**: Loader parse errors surface as raw exceptions with no file context. A YAML syntax error produces a generic error message without the file path or line number.

**File**: New file `packages/core/src/loaders/errors.ts`

**Change**: Create a `LoaderError` class:

```typescript
export class LoaderError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly format: string,
    public readonly line?: number,
    public readonly column?: number,
  ) {
    super(`${format} parse error in ${filePath}${line ? `:${line}` : ''}: ${message}`)
    this.name = 'LoaderError'
  }
}
```

Wrap parse calls in each loader with try/catch that creates `LoaderError`:

```typescript
// In yaml.ts
try {
  const data = yaml.parse(raw)
  return { data }
} catch (err: any) {
  throw new LoaderError(err.message, filePath, 'YAML', err.linePos?.[0]?.line)
}
```

---

### 4.2 Extract Shared Vite Plugin

**Problem**: `vite-plugin-content.ts` is duplicated across `examples/with-react/`, `examples/with-solid/`, and `examples/with-svelte/`.

**Change**: Either create `packages/vite-plugin/` as `@pagesmith/vite`, or move the shared plugin to `examples/shared-content/vite-plugin-content.ts` and have each example import from there. The latter is simpler and avoids a new package for now.

---

### 4.3 Add Integration Tests

**Problem**: Only `loaders.test.ts` and `frontmatter.test.ts` exist. No tests for the validation pipeline, collection loading, computed fields, or slug generation.

**Priority test files to create**:

1. `packages/core/src/__tests__/store.test.ts` — collection loading, caching, invalidation
2. `packages/core/src/__tests__/validation-runner.test.ts` — shared MDAST, error recovery, custom validators
3. `packages/core/src/__tests__/slug.test.ts` — edge cases: README, index, nested, no extension
4. `packages/core/src/__tests__/content-layer.test.ts` — full pipeline integration
5. `packages/core/src/__tests__/pipeline.test.ts` — markdown rendering, heading extraction, code blocks

---

## Phase 5: Roadmap Features (P2-P3)

These features are not bugs or quality issues — they're competitive gaps compared to Astro, Velite, and Contentlayer. Implement them as the library matures.

### 5.1 TypeScript Type Generation (P2)

Every competitor generates types from content schemas. Add a CLI command:

```bash
pagesmith generate --config content.config.ts --output .content/types.d.ts
```

The generator reads collection schemas, runs `z.infer<>` at build time, and writes a `.d.ts` file with typed collection accessors.

### 5.2 Content References Between Collections (P2)

Astro's `reference('authors')` pattern. Add a `reference()` helper to the schema definition:

```typescript
const posts = defineCollection({
  schema: z.object({
    author: reference('authors'), // validates that the slug exists in 'authors' collection
  }),
})
```

Requires cross-collection access during validation — the store already has this capability.

### 5.3 Singleton Collections (P3)

Support `single: true` in collection definition to return a single object instead of an array. Useful for site config, global settings, etc.

### 5.4 Content-Specific Zod Helpers (P3)

Inspired by Velite's `s` object. Create `@pagesmith/core/schemas` helpers:

```typescript
import { ps } from '@pagesmith/core/schemas'

const posts = defineCollection({
  schema: z.object({
    toc: ps.toc(),         // extracts table of contents from body
    readTime: ps.readTime(), // computes reading time from body
    excerpt: ps.excerpt({ length: 200 }), // generates excerpt
  }),
})
```

### 5.5 Sorting / Pagination Utilities (P3)

```typescript
import { sortByDate, paginate } from '@pagesmith/core/utils'

const sorted = sortByDate(posts, 'data.date', 'desc')
const page1 = paginate(sorted, { pageSize: 10, page: 1 })
```

---

## Execution Order

```
Phase 1 (P0 — do first, no dependencies between items):
  1.1  Share MDAST across validators
  1.2  Fix double schema validation
  1.3  Wire plugin system or remove dead code
  1.4  Fix JsonLoader/JsoncLoader overlap

Phase 2 (P1 — after Phase 1):
  2.1  Cache unified processor
  2.2  Parallelize entry loading
  2.3  Document getEntry behavior

Phase 3 (P1-P2 — after Phase 2):
  3.1  Compute read time from raw markdown
  3.2  Remove .d.ts from src/
  3.3  Add error boundary for entry loading

Phase 4 (P2 — after Phase 3):
  4.1  Structured loader errors
  4.2  Extract shared vite plugin
  4.3  Add integration tests

Phase 5 (P2-P3 — roadmap):
  5.1  TypeScript type generation
  5.2  Content references
  5.3  Singleton collections
  5.4  Content-specific Zod helpers
  5.5  Sorting / pagination utilities
```

---

## Testing Strategy

After each phase, run:

```bash
vp test run           # Vitest — ensure no regressions
vp check              # lint, format, and TypeScript type checks
npm run build         # Vite build — ensure packages compile
```

For performance changes (Phase 2), add benchmarks:

```bash
# Create packages/core/src/__bench__/loading.bench.ts
# Compare before/after for:
# - Collection loading time (100 entries)
# - Validation time per entry (with MDAST sharing)
# - Markdown rendering time (with processor caching)
```
