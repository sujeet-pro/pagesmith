---
name: prj-diagramkit-setup
description: Install and configure diagramkit in a repository. Adds the package, runs Playwright warmup, wires package.json scripts, optionally creates diagramkit.config.json5, and installs project skills. Use when the user asks to set up, add, install, or bootstrap diagramkit in their repo.
---

# prj-diagramkit-setup

Follow the version-pinned skill that ships with the locally installed `diagramkit` package:

→ [`node_modules/diagramkit/skills/diagramkit-setup/SKILL.md`](../../../node_modules/diagramkit/skills/diagramkit-setup/SKILL.md)

Always anchor on the local install (`npx diagramkit ...`, never a global one). Read `node_modules/diagramkit/REFERENCE.md` first if you have not already.

Pagesmith-specific notes:

- This repo already installs `diagramkit` and ships `diagramkit.config.json5` at the root (with `sameFolder: true`). The setup skill's install / config steps are usually no-ops here — skip them unless you're intentionally bootstrapping a fresh clone.
- Package scripts are already wired: `npm run diagramkit:warmup`, `npm run render:diagrams`. Do not rename them.
- When the user is bootstrapping a new Pagesmith-consumer repo (not this monorepo), run the full setup skill against that repo.
