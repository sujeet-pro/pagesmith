---
name: pagesmith-site-use-preset
description: Point the pagesmith-site CLI at a bundled preset (for example @pagesmith/docs/preset or an internal preset) to consume its init, dev, build, preview, and MCP hooks. Use when the user wants to share a site template across projects, switch between Pagesmith presets, or swap the default preset for an internal one.
---

# Use A Site Preset

A preset is a package that exports an object with `init`, `dev`, `build`, `preview`, and optionally `mcp` hooks. `@pagesmith/docs/preset` is the canonical example. Teams can author internal presets to codify their own docs/blog/marketing conventions.

## Read the locally installed reference first

Before editing config or running CLI commands, open `node_modules/@pagesmith/site/REFERENCE.md` in the consumer's project. It is version-matched to the installed package and authoritative for the `Preset` interface, preset resolution order, and the `pagesmith-site` CLI flags (including `--preset`). When the consumer is on the docs preset, also open `node_modules/@pagesmith/docs/REFERENCE.md` for preset-specific config and the `pagesmith-docs` CLI surface. If they disagree with this skill or general training data, follow the local files.

Always invoke the CLI through `npx pagesmith-site <command>` (or `npx pagesmith-docs <command>` when the docs preset is active), or via `package.json` scripts, so it resolves to the project's `node_modules/.bin` rather than any globally installed binary that may be a different version.

## When to use this skill

- The user already has a Pagesmith site and wants to adopt a shared preset.
- The user shipped an internal preset and wants to consume it via `pagesmith-site`.
- The user is choosing between `@pagesmith/docs` and a custom preset.
- A preset works but the CLI is picking the wrong one — fix preset resolution.

If the user wants to set up a new site from scratch, run `pagesmith-docs-setup` (for docs) or `pagesmith-site-setup` (for custom sites) first.

## Install the preset

```bash
npm add @pagesmith/docs             # ships the official docs preset
# or
npm add @your-scope/pagesmith-preset-x   # an internal preset
```

## Point the CLI at the preset

The CLI resolves preset in this priority order (first match wins):

1. `--preset <specifier>` on the command line.
2. `PAGESMITH_PRESET` environment variable.
3. `preset:` or `presets:` field in `pagesmith.config.json5`.
4. Auto-detection of known presets in `dependencies`.

Preferred: pin the preset in config so every contributor and CI run sees the same thing.

```json5
// pagesmith.config.json5
{
  preset: '@pagesmith/docs',
  name: 'My Docs',
  title: 'My Docs',
  origin: 'https://example.com',
  basePath: '/',
  contentDir: './docs',
}
```

For multiple presets (rare), use `presets`:

```json5
{
  presets: ['@pagesmith/docs', '@your-scope/pagesmith-preset-analytics'],
}
```

Later presets layer on top; they can add config defaults and hooks but must not override earlier presets.

## Run the CLI

```bash
npx pagesmith-site init
npx pagesmith-site dev
npx pagesmith-site build
npx pagesmith-site preview
```

When a preset ships its own wrapper CLI (for example `pagesmith-docs`), that CLI is equivalent to `pagesmith-site --preset @pagesmith/docs`. Use whichever the preset author recommends — they are interchangeable functionally.

## Swapping presets

If you migrate from one preset to another:

1. Update `preset` in `pagesmith.config.json5`.
2. Check `theme.layouts.*` and `theme.components.*` for paths that only existed in the old preset.
3. Re-run `pagesmith-site init --yes` to scaffold preset-specific files (safe: it does not overwrite existing content).
4. Run `pagesmith-site build` and fix any config schema errors surfaced by the new preset.

## Authoring a new preset

If the user wants to write their own:

```ts
// packages/my-preset/src/preset.ts
import type { Preset } from '@pagesmith/site/preset'

export default {
  name: '@your-scope/pagesmith-preset-x',
  async init(ctx) { /* scaffold files, write config defaults */ },
  async dev(ctx)  { /* return Vite plugins */ return [] },
  async build(ctx){ /* return SSG routes */ return [] },
  async preview(ctx){ /* return a request handler */ },
  async mcp(ctx)  { /* register MCP tools */ },
} satisfies Preset
```

Export both a module entry (so `preset: '@your-scope/pagesmith-preset-x'` resolves) and a `bin/` wrapper (so `your-preset-name init` works like `pagesmith-site init --preset <x>`).

Publish it with the `skills/` folder shipped the same way `@pagesmith/docs` ships skills, so downstream agents can install them with `npx pagesmith-core skills --package <your-preset-package>`.

## Verify

After changing the preset:

- `npx pagesmith-site dev` — starts without "preset not found" errors.
- `npx pagesmith-site build` — produces the expected output layout for the new preset.
- The resolved preset shows up in CLI logs (`[pagesmith] using preset: @pagesmith/docs`).

## Gotchas

- `preset:` in `pagesmith.config.json5` is a package specifier. It cannot be a relative path unless you `npm link` the preset into `node_modules`.
- If both `preset:` and `presets:` are present, `presets:` wins and `preset:` is ignored. Pick one.
- Do not set `PAGESMITH_PRESET` in shell profiles; scope it to CI or a single shell session.
- When developing a preset locally in the same repo, use `npm workspaces` with a `"preset": "my-preset"` path so resolution is deterministic across machines.
- Preset hooks run in the order they are declared. A preset that writes files in `init` overrides files from an earlier preset — plan composition order before chaining presets.

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `./references/site-guidelines.md`
- `./references/recipes.md`
- `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` (for the official docs preset)
