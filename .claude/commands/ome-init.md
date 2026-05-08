---
description: Initialize .ome project configuration and Agent rules.
---

# ome-init

Use Initialize Oh My Engine for the current project.

Trigger: `/ome-init`
Terminal equivalent: `ome-init [--install-agents]`

Before making changes:
- Read `OME.md` if present.
- Read relevant files under `.ome/rules/`.
- Treat `.ome/` as the project-local source of truth.
- If `.ome/` is missing, ask the user to run `ome init` in the project root.

Skill anatomy discipline:
- Start by deciding whether the task is define, plan, build, test, review, or ship work.
- Name assumptions before relying on them.
- Stop and surface concrete conflicts when requirements, code, tests, or rules disagree.
- Prefer the smallest project-consistent implementation and avoid unrelated cleanup.
- Reject shortcuts such as skipping tests, testing later, or treating no error output as proof.

Task:
- Initialize .ome project configuration and Agent rules.
- Run or guide the equivalent `ome init` command first.
- After initialization, continue with the `ome-init-rules` workflow in the same project.
- Do not stop after summarizing initialization; personalize `.ome/rules/*.md` from the current source code.
- Finish by running `ome rules sync` so all Agent editor files receive the updated rules.
- Use the user arguments as the workflow input.
- Keep generated project rules in the project; do not write project rules to the global Agent directory.

Arguments:
- Claude/Cursor/Qoder/OpenCode style commands receive the user text after the command.
- Codex skill clients should pass the same arguments after the skill name.

If shell execution is available, prefer running the equivalent `ome-*` command and then continue from its guidance.
