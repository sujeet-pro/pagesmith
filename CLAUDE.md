@AGENTS.md

## Claude Code addendum

Everything above this line is loaded automatically from `AGENTS.md` via Claude Code's native `@file` import — it is the single source of truth for repo-wide contributor guidance. Do not duplicate it here.

- `.claude/settings.json` pre-approves `Bash(npm run *)`, `Bash(npx pagesmith *)`, and `Bash(npx diagramkit *)` so the common validate/build/render workflows in `AGENTS.md#Commands` do not need a permission prompt per call.
- `.claude/skills/` mirrors `.agents/skills/` (thin pointers only, per `AGENTS.md`'s Contributor Skills Contract). Edit skill bodies under `.agents/skills/`, never here.
- If a behavior is genuinely Claude-Code-specific (not applicable to other agents), add it below this line instead of folding it into `AGENTS.md`.
