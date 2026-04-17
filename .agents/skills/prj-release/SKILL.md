---
name: prj-release
description: Publish a coordinated @pagesmith/core + @pagesmith/site + @pagesmith/docs release. Use when cutting a new version, running a partial re-publish, or recovering from a failed publish.
---

# Project Release

## Quick Start

1. Read `CLAUDE.md` and `.github/workflows/publish.yml`.
2. Check `MIGRATING.md` and `packages/*/skills/pagesmith-*-setup/references/changelog-notes.md` for pending release notes.
3. Confirm `npm run cicd` passes locally before triggering a release.

## Workflow

1. Decide the version. Use `inputs.version` for an explicit release (e.g. coordinating with pre-release versions) or `inputs.bump` with `patch|minor|major` for the next bump.
2. Sync `packages/{core,site,docs}/package.json` versions with `scripts/sync-package-versions.ts` (the workflow calls it; locally: `npm run sync:versions -- <version>`).
3. Run the `Publish` GitHub Actions workflow with the chosen inputs.
4. After publish:
   - Verify `npm view @pagesmith/core@<version>` and siblings.
   - Confirm the workflow created the release commit + tag on `main`.
   - Smoke-test `npx pagesmith-docs@<version> init --ai` in an empty folder.
5. Update repo docs content for new public behavior if the release introduced it.

## Rules

- Never publish partial versions manually. Always coordinate core → site → docs from the publish workflow.
- The workflow refuses to start a fresh `auto` bump if only some packages are already on the target version. Use explicit `version` in that case.
- Trusted Publisher (OIDC) provenance is enabled; do not pass `--dry-run` or remove `--provenance`.

## Verification

- `npm view @pagesmith/core versions --json | tail -n 5`
- `git tag --list 'v*' | tail -n 5`
- `gh workflow view Publish --web`
