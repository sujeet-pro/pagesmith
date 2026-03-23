# Vite+ Toolchain Migration

**Goal**: Unified DX with Vite ecosystem. Replace tsup, remove tsx, use Vite 8 + Vitest 4 + oxlint + dprint.

## Toolchain

| Purpose               | Before              | After                                |
| --------------------- | ------------------- | ------------------------------------ |
| Package build         | tsup                | Vite 8 lib mode                      |
| TS execution          | tsx                 | Node 24 `--experimental-strip-types` |
| Testing               | vitest (standalone) | Vitest 4 (via Vite)                  |
| Linting               | oxlint (no config)  | oxlint (with config)                 |
| Formatting            | dprint (no config)  | dprint (with config)                 |
| Type checking         | tsc (implicit)      | typescript 5.9 tsc                   |
| JS bundling (runtime) | rolldown            | rolldown (stays, used by Vite)       |
| CSS bundling          | lightningcss        | lightningcss (stays, used by Vite)   |

## Changes

### 1. Root package.json

- Remove: tsx from all devDeps
- Add: vite ^8.0.0, vitest ^4.1.0, typescript ^5.9.0 as root devDeps
- Update scripts to use node --experimental-strip-types instead of tsx
- Add: typecheck script using tsc --noEmit

### 2. Package builds (core, content, pagesmith)

- Replace tsup.config.ts → vite.config.ts (lib mode)
- Remove tsup from devDeps
- Build script: vite build

### 3. Docs

- Rebuild as simple markdown → HTML using @pagesmith/content
- Simple sidebar layout, no runtime JS, plain CSS
- Run via node --experimental-strip-types

### 4. Examples

- Replace tsx → node --experimental-strip-types in scripts
- Vite examples (react, solid, svelte) already use vite

### 5. Testing

- vitest.config.ts at root (workspace mode)
- Sample test in packages/core, packages/content
- Coverage via vitest --coverage

### 6. Linting

- Create .oxlintrc.json at root
- Ensure zero errors

### 7. Formatting

- Create dprint.json at root
- Ensure zero errors
