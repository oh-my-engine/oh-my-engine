---
name: ome-memory
version: 1.0.0
description: Inspect local Oh My Engine memory and adopted learnings.
author: oh-my-engine
tags: [ome, memory, action]
allowed-tools: Bash(ome memory view:*)
---

<!-- OME:ACTION -->
# ome-memory

> **Action command — execute, do not narrate.**
> When the user invokes this command, you MUST do the following before any other reasoning or commentary:
>
> 1. Run this shell command exactly (substitute `$ARGUMENTS` with whatever the user passed, empty if none):
>
>    ```bash
>    ome memory view $ARGUMENTS
>    ```
>
> 2. Show the raw output to the user.
> 3. Add commentary ONLY after the output is shown, and only if the user explicitly asks.
>
> Do NOT print the Reference section below unless the user asks "how do I use this". The user invoked this command to see memory inspection results, not docs.

Claude Code fast path — the line below starting with `!` is pre-executed automatically. Other agents: ignore the leading `!` and run the bare command via your shell tool, following the instructions above.

!ome memory view $ARGUMENTS

---

## Reference (only show when the user asks)

Underlying CLI: `ome memory view`

Supported `--type` values (v1):
- `executions` (default)
- `preferences`
- `learnings`
- `adopted-learnings`
- `skill-candidates`
- `generated-skills`

Other flags:
- `--workflow <name>` — filter execution records by workflow
- `--scope <user|project>` — filter preferences by scope
- `--project-root <path>` — override the project root
- `--format text|json` — output format (default `text`)

Examples:

```bash
ome memory view
ome memory view --type executions --workflow spec
ome memory view --type preferences --scope user
ome memory view --type learnings
ome memory view --type skill-candidates
ome memory view --type executions --format json
```

For deeper docs see `.ome/skills/ome-memory/SKILL.md` or run `ome memory view --help`.

**Note**: v1 stores only events that pass the policy gate. Empty output means nothing has been recorded yet — invoke a workflow command and finish it (`ome finish`) to populate the store.
