---
description: Refresh scan context, inspect current source code, rewrite .ome/rules, and sync Agent rules.
---

# ome-init-rules

Use Personalize Oh My Engine Rules for the current project.

Trigger: `/ome-init-rules`
Terminal equivalent: `ome init-rules`

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
- Refresh scan context, inspect current source code, rewrite .ome/rules, and sync Agent rules.
- Run or guide `ome init-rules` to refresh `.ome/context/project-scan.json` and `.ome/context/rules-generation-prompt.md`.
- If `ome init-rules` is unavailable, do not stop; read the existing `.ome/context/rules-generation-prompt.md` and continue manually.
- Read `OME.md`, `.ome/context/project-scan.json`, and `.ome/context/rules-generation-prompt.md`.
- Inspect representative current source files, tests, scripts, and existing conventions before editing rules.
- Rewrite `.ome/rules/*.md` so they are specific to this repository, not generic framework advice.
- Add, rename, or remove rule files as needed; do not force the project into a fixed four-rule template.
- Use project-specific rule names when the scan supports them, such as `server-koa`, `routing-middleware`, `build-gulp`, `views-static-assets`, `data-access`, or `deployment`.
- Do not create React Native, theme, design-token, or i18n rules unless current source/dependencies show those signals.
- Run `ome rules sync` after editing rules.
- Report which rule files changed and which verification commands were run.
- Use the user arguments as the workflow input.
- Keep generated project rules in the project; do not write project rules to the global Agent directory.

Arguments:
- Claude/Cursor/Qoder/OpenCode style commands receive the user text after the command.
- Codex skill clients should pass the same arguments after the skill name.

If shell execution is available, prefer running the equivalent `ome-*` command and then continue from its guidance.
