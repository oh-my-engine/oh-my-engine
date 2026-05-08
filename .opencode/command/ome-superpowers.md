---
description: Install, update, or inspect Superpowers bridge entries for supported Agent editors.
---

# ome-superpowers

Use Superpowers Bridge for the current project.

Trigger: `/ome-superpowers`
Terminal equivalent: `ome superpowers <install|update|doctor>`

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
- Install, update, or inspect Superpowers bridge entries for supported Agent editors.
- Run or guide `ome superpowers doctor` first to inspect support status.
- Use `ome superpowers install all` when the user asks to install across Agent editors.
- For editors without native Superpowers support, use the generated Oh My Engine wrapper workflow.
- Do not copy third-party Superpowers sources into project rules.
- Use the user arguments as the workflow input.
- Keep generated project rules in the project; do not write project rules to the global Agent directory.

Arguments:
- Claude/Cursor/Qoder/OpenCode style commands receive the user text after the command.
- Codex skill clients should pass the same arguments after the skill name.

If shell execution is available, prefer running the equivalent `ome-*` command and then continue from its guidance.
