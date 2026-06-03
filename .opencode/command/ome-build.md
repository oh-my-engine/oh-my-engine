---
description: Implement scoped changes in small verified slices using project rules.
---

# ome-build

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome build $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd build $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome build $ARGUMENTS
```

## Purpose
Implement scoped changes in small verified slices using the repository rules and plan.

## When to Use
- Use when the change is approved and the next step is implementation.
- Use when the scope is small enough to verify in slices.
- Do not use when the request still needs definition or planning.

## Inputs
- The approved task or plan.
- Relevant source files, tests, and project rules.
- Any known constraints that must survive the change.

## Process
1. Start with the smallest slice that proves the change.
2. Keep edits close to the existing project structure and patterns.
3. Lock behavior with tests when the change is risky.
4. Apply the fix or feature in incremental steps.
5. Run the nearest meaningful verification after each meaningful slice.
6. Avoid unrelated cleanup or broad refactors.
7. Report the changed files, implementation summary, and verification.

## Red Flags
- The patch expands beyond the approved scope.
- A testable behavior change is made without verification.
- The implementation invents new abstractions unnecessarily.
- The change depends on a hidden assumption that was not confirmed.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Run targeted tests or behavior checks that prove the slice.
- Broaden verification when the blast radius warrants it.
- State any validation that could not be run.
- Confirm no unrelated files were changed.

## Output Contract
Final response must include:
- Changed files
- Implementation summary
- Verification
- Remaining risks


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
