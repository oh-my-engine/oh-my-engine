---
name: ome-define
version: 1.0.0
description: Clarify goal, scope, success criteria, and assumptions before implementation.
author: oh-my-engine
tags: [ome, define, workflow]
---

# ome-define

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome define $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd define $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome define $ARGUMENTS
```

## Purpose
Clarify the task, lock scope, and produce a decision-ready problem statement before implementation.

## When to Use
- Use when the request is ambiguous, broad, or under-specified.
- Use when the goal, constraints, or success criteria are still moving.
- Do not use when an approved implementation plan already exists.

## Inputs
- User task description and any attached context.
- Relevant project rules, scans, or docs that can resolve ambiguity.
- Known constraints, deadlines, compatibility requirements, and non-goals.

## Process
1. State the goal in one sentence.
2. Identify the user, the workflow, and the success criteria.
3. Separate known facts from assumptions and open questions.
4. List the minimum scope needed to solve the problem.
5. Call out any blocking ambiguity that needs a decision.
6. Keep the result concise and decision-ready.
7. Do not speculate beyond the evidence you can ground.

## Red Flags
- The task can be answered by reading the repo or docs directly.
- The scope keeps expanding while the request stays vague.
- A hidden assumption would materially change the implementation.
- The request is really a planning or build task rather than a definition task.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Confirm the statement matches the user intent.
- Confirm assumptions are explicit and limited.
- Confirm any open questions are actually blocking.
- State what is known versus what still needs a decision.

## Output Contract
Final response must include:
- Goal statement
- Scope and non-goals
- Assumptions and open questions
- Next decision required


## Workflow Completion (MANDATORY)

After you finish the work for this workflow — successful or not — you MUST run the following shell command as the very last step, AFTER you have reported results to the user:

```bash
ome finish
```

This records the execution into `.ome/memory/executions/` so the engine can learn from it.

Skip ONLY if all of these are true:
- The user explicitly said "do not record" or "just testing".
- You made zero file changes.
- You wrote zero new code.
- You ran zero verifications.

Do NOT skip because "the task was small" or "nothing interesting happened" — the engine's policy gate decides what to keep, not you.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome finish
```
