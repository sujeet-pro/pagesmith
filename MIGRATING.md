# Migrating to Current Pre-1.0 API

Pagesmith is still pre-1.0, so breaking changes are expected between minor releases while APIs and docs workflows settle.

This guide captures the current migration expectations for projects upgrading from earlier pre-release versions.

## High-impact changes

### Example dev/build commands

- Use `vite dev` and `vite build` in example-style integrations.
- Avoid relying on `vp` in downstream example apps unless you intentionally use Vite+ in that project.

### `@pagesmith/core` Vite and MCP subpaths

- Import Vite integrations from `@pagesmith/core/vite`.
- Import core MCP server and helpers from `@pagesmith/core/mcp`.
- For SSG helper utilities, use `@pagesmith/core/ssg-utils`.

### `@pagesmith/docs` theme and MCP subpaths

- Import docs MCP server from `@pagesmith/docs/mcp`.
- Import docs theme exports from `@pagesmith/docs/theme` when needed.

### AI-first docs workflow

- Preferred setup path is now `npx pagesmith init --ai`.
- Onboarding-first navigation ordering is expected for docs guides.

## Suggested upgrade checklist

1. Update imports to package export-map subpaths (`/vite`, `/mcp`, `/theme`, `/ssg-utils`) where applicable.
2. Update app scripts to `vite dev` / `vite build` in framework examples and custom integrations.
3. Re-run docs scaffolding if needed with `npx pagesmith init --ai`.
4. Run:
   - `vp check`
   - `vp test`
   - `npm run build:examples`

## Where to look for version-matched details

- `node_modules/@pagesmith/core/docs/agents/changelog-notes.md`
- `node_modules/@pagesmith/docs/docs/agents/changelog-notes.md`
- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/docs/REFERENCE.md`
