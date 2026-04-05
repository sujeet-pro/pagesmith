# @pagesmith/docs Migration Notes (Pre-1.0)

`@pagesmith/docs` is pre-1.0. Minor releases can include breaking changes while conventions and APIs are finalized.

## Upgrade checklist

1. Prefer package export-map subpaths where relevant:
   - `@pagesmith/docs/mcp`
   - `@pagesmith/docs/theme`
2. Keep docs setup aligned with the AI-first bootstrap flow:
   - `npx pagesmith init --ai`
3. Keep manual navigation ordering onboarding-first in `guide/meta.json5`.
4. Re-run validation and tests after upgrade:
   - `vp check`
   - `vp test`

## Behavior updates to note

- Config internals are decomposed into `config/types`, `config/resolve`, `config/validate`, and `config/shared` with stable top-level re-exports.
- CLI arg parsing and server shared helpers are now modularized, improving maintainability and testability.
- Docs MCP tooling and docs runtime paths are covered by dedicated tests (`build`, `render`, `server`, `mcp`).

## Related docs

- `docs/agents/changelog-notes.md`
- `REFERENCE.md`
