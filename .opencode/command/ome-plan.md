---
description: Create implementation guidance with interfaces, edge cases, and test strategy.
---

# ome-plan

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome plan $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd plan $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome plan $ARGUMENTS
```

## Purpose
Turn a clarified task into an implementation plan with interfaces, edge cases, and test strategy.

## When to Use
- Use when the goal is known but the implementation still needs design decisions.
- Use when you need a precise sequence of edits before writing code.
- Do not use when the task is already a tiny, obvious change.

## Inputs
- The clarified goal and scope.
- Relevant project rules, source files, and existing patterns.
- Known edge cases, compatibility constraints, and verification expectations.

## Process
1. Summarize the goal and any constraints that matter.
2. Identify the narrowest implementation path that preserves existing behavior.
3. List interfaces, files, or modules that may change.
4. Call out edge cases and failure modes before coding.
5. Define the test strategy and acceptance criteria.
6. Produce a plan that another engineer could implement without guessing.
7. Avoid writing code in the planning step.

## Red Flags
- The plan makes undocumented assumptions about public interfaces.
- The approach requires broad refactors without a clear need.
- Tests or edge cases are missing from the proposal.
- The result is really implementation disguised as planning.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Check that the plan covers interfaces, edge cases, and tests.
- Check that assumptions and dependencies are explicit.
- Check that the plan stays within the requested scope.
- Check that the next implementation step is unambiguous.

## Output Contract
Final response must include:
- Implementation summary
- Files or interfaces that may change
- Test plan
- Assumptions and risks


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
