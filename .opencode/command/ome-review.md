---
description: Review correctness, readability, architecture, security, performance, and tests.
---

# ome-review

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome review $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd review $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome review $ARGUMENTS
```

## Purpose
Review code for correctness, maintainability, risk, and missing verification before it ships.

## When to Use
- Use when a diff, PR, or file set needs a real engineering review.
- Use when correctness or regressions matter more than style alone.
- Do not use when you need to implement the change yourself.

## Inputs
- The diff, file list, or PR description.
- Relevant project rules and adjacent code.
- Any tests, logs, or expected behavior that frame the review.

## Process
1. Read the changed code and the nearby context.
2. Check the change against the project rules and existing patterns.
3. Look for correctness bugs, regression risks, and missing tests.
4. Apply the behavioral quality gate: assumptions surfaced, simplicity preserved, scope stayed surgical, and verification is concrete.
5. Call out maintainability or architecture concerns that matter.
6. Prioritize findings by severity and likelihood.
7. Avoid hand-wavy praise or summary-only responses.
8. End with concrete issues, assumptions, behavioral-gate result, and residual risk.

## Red Flags
- The review does not identify specific files or lines.
- The change alters behavior without sufficient test coverage.
- A security, correctness, or compatibility concern is ignored.
- The review turns into implementation advice instead of findings.
- The review ignores overengineering, speculative abstractions, drive-by refactors, or unrelated edits.
- The review accepts vague verification instead of concrete tests, checks, or stated gaps.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Confirm findings are tied to the actual diff.
- Confirm severity is grounded in real behavior or risk.
- Confirm any missing test or verification concern is stated plainly.
- Confirm every behavioral quality gate dimension is pass, warning, fail, or not applicable.
- State if no issues were found and why.

## Output Contract
Final response must include:
- Findings ordered by severity
- Open questions or assumptions
- Behavioral quality gate: assumptions, simplicity, surgical scope, verification
- Concise change summary
- Residual risk


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
