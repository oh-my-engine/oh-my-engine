---
name: ome-remember
version: 1.0.0
description: Explicitly remember a reusable preference or instruction.
author: oh-my-engine
tags: [ome, remember, action]
allowed-tools: Bash(ome memory remember:*)
---

<!-- OME:ACTION -->
# ome-remember

> **Action command — execute, do not narrate.**
> When the user invokes this command, you MUST do the following before any other reasoning or commentary:
>
> 1. Run this shell command exactly (substitute `$ARGUMENTS` with whatever the user passed, empty if none):
>
>    ```bash
>    ome memory remember $ARGUMENTS
>    ```
>
> 2. Show the raw output to the user.
> 3. Add commentary ONLY after the output is shown, and only if the user explicitly asks.
>
> Do NOT print the Reference section below unless the user asks "how do I use this". The user invoked this command to see explicit memory recording results, not docs.

Claude Code fast path — the line below starting with `!` is pre-executed automatically. Other agents: ignore the leading `!` and run the bare command via your shell tool, following the instructions above.

!ome memory remember $ARGUMENTS

---

## Reference (only show when the user asks)

Underlying CLI: `ome memory remember`

For detailed flags and examples, run `ome memory remember --help` or read `.ome/skills/ome-remember/SKILL.md` directly.
