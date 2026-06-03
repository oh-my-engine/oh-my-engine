---
description: Design behavior-focused tests, regression coverage, and failure diagnosis.
---

# ome-test

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome test $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd test $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome test $ARGUMENTS
```

## Purpose
Design behavior-focused tests and regression coverage that prove the intended project behavior.

## When to Use
- Use when a behavior change needs coverage or a regression needs protection.
- Use when you need to reproduce a failure before fixing it.
- Do not use when the task is only a documentation or planning exercise.

## Inputs
- The behavior, failure, or feature under test.
- Relevant source files, fixtures, and existing test patterns.
- The narrowest command or check that can prove the case.

## Process
1. Identify the behavior that must be protected.
2. Find the nearest existing test style or fixture pattern.
3. Add the smallest deterministic test that proves the behavior.
4. Include failing-before evidence when the task is a regression fix.
5. Keep the test close to the changed code.
6. Run the relevant tests and broaden only when needed.
7. Report what is covered and what remains unverified.

## Red Flags
- The test only checks implementation details.
- The fixture is noisy or nondeterministic.
- A failing regression is not demonstrated when one is expected.
- The verification command does not prove the behavior.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Run the new or updated test.
- Run any nearby regression or type checks needed for confidence.
- State exact failures or gaps if the test cannot run.
- Confirm the test is behavior-focused rather than incidental.

## Output Contract
Final response must include:
- Tests added or updated
- Behavior verified
- Verification commands
- Remaining gaps


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
