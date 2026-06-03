---
description: Clarify goal, scope, success criteria, and assumptions before implementation.
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


## Workflow Completion (SUBSTANTIVE WORK ONLY)

Run `ome finish` only after a substantive workflow loop is complete, and only after you have reported results to the user.

Substantive work means at least one of these is true:
- You changed files or wrote new code/docs.
- You ran verification and the result matters to the task outcome.
- You made a durable technical decision, diagnosis, or reusable learning that should be available later.

Do NOT run `ome finish` for ordinary conversation, quick explanations, brainstorming with no conclusion, or read-only exploration that produced no reusable outcome.

When the work is substantive, run this as the final shell command:

```bash
ome finish
```

This records the execution into `.ome/memory/executions/`; the engine policy decides whether it is valuable enough to persist or later evolve.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome finish
```
