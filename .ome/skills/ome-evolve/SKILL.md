---
name: ome-evolve
version: 1.0.0
description: Analyze local memory for learning and skill candidates.
author: oh-my-engine
tags: [ome, evolve, action]
allowed-tools: Bash(ome evolve analyze:*)
---

<!-- OME:ACTION -->
# ome-evolve

> **Action command — execute, do not narrate.**
> When the user invokes this command, you MUST do the following before any other reasoning or commentary:
>
> 1. Run this shell command exactly (substitute `$ARGUMENTS` with whatever the user passed, empty if none):
>
>    ```bash
>    ome evolve analyze $ARGUMENTS
>    ```
>
> 2. Show the raw output to the user.
> 3. Add commentary ONLY after the output is shown, and only if the user explicitly asks.
>
> Do NOT print the Reference section below unless the user asks "how do I use this". The user invoked this command to see evolution analysis results, not docs.

Claude Code fast path — the line below starting with `!` is pre-executed automatically. Other agents: ignore the leading `!` and run the bare command via your shell tool, following the instructions above.

!ome evolve analyze $ARGUMENTS

---

## Reference (only show when the user asks)

Underlying CLI: `ome evolve analyze`

Flags:
- `--project-root <path>` — override the project root
- `--format text|json` — output format (default `text`)

Related verify / adopt commands (separate from this action):

```bash
ome evolve verify-learning --slug <slug>
ome evolve adopt-learning  --slug <slug>
ome evolve verify-skill    --slug <slug>
ome evolve adopt-skill     --slug <slug>
ome evolve review
```

What `analyze` does (v1):
1. Reads `.ome/memory/executions/` and `.ome/memory/preferences/`.
2. Surfaces repeated successful patterns as learning candidates (default threshold ≥3 evidence).
3. Surfaces repeated bug-fix patterns as skill candidates (default threshold ≥3).
4. Surfaces repeated agent-behavior antipatterns (overengineering, unrelated edits, missing verification, hidden assumptions) as learning candidates.
5. Surfaces re-confirmed explicit preferences (default threshold ≥2).
6. Writes candidates under `.ome/memory/learnings/candidates/` and `.ome/memory/skill-candidates/`.
7. Does NOT auto-adopt — use the verify/adopt commands above.

Config lives under `.ome/config.json` -> `evolution`. See `.ome/skills/ome-evolve/SKILL.md` for details.
