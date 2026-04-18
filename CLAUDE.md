# Pagesmith — Claude Memory

All AI contributor guidance for this repository lives in a single file: [`AGENTS.md`](./AGENTS.md).

Read `AGENTS.md` in full before acting. It covers:

- Repo layout and module boundaries.
- The split between **contributor** guidance (this repo) and **consumer** guidance (projects that install `@pagesmith/*`).
- Scratch-space rules (`.temp/`).
- Canonical locations for contributor skills (`.agents/skills/prj-*`) and consumer skills (`skills/pagesmith-*`).
- Locked principles, repo rules, and the commands you will most often run.

The `.claude/skills/` and `.cursor/skills/` trees mirror `.agents/skills/` (same folder names only): each `SKILL.md` points at the canonical file under `.agents/skills/<name>/SKILL.md`. Edit skill bodies only under `.agents/skills/`; when you add, remove, rename, or change canonical frontmatter (`name` / `description`), update both `.claude/skills/` and `.cursor/skills/` wrappers in the same commit per `AGENTS.md`.

Do not duplicate guidance here — if you need to change Claude-specific behavior, either update `AGENTS.md` (if it applies to all agents) or add a Claude-only addendum at the bottom of this file.
