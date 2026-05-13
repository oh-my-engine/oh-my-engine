---
description: Analyze, diagnose, and plan a bug fix using project rules.
---

# ome-bug

## Purpose
Diagnose a reported bug, identify the root cause, apply a focused fix, and prove the behavior with regression evidence.

## When to Use
- Use for runtime failures, incorrect behavior, regressions, flaky behavior, or issue reports.
- Use when the user provides an issue description, failing test, log, screenshot, or reproduction.
- Do not use for broad feature planning unless the task starts from a concrete defect.

## Inputs
- User bug description or issue ID.
- Relevant source files, tests, logs, and reproduction steps.
- `OME.md`, `.ome/rules/`, and `ome guidance bug-analysis --input "<issue-description>"`.
- References: `testing.md` and `code-review.md`.

## Process
1. Load OME guidance and project rules before changing code.
2. Extract expected behavior, actual behavior, reproduction steps, and impact.
3. Locate the smallest relevant code path and existing tests.
4. For behavior bugs, add or identify a failing reproduction test before fixing unless an equivalent check is more appropriate.
5. Apply the smallest fix that follows existing project patterns.
6. Run targeted verification, then broader checks when the blast radius warrants it.
7. Report root cause, changed files, verification, and remaining risks.

## Red Flags
- The reported behavior conflicts with an existing spec or project rule.
- The fix requires a new dependency or broad refactor that the user did not request.
- The issue cannot be reproduced and no equivalent evidence is available.
- The patch touches unrelated modules or cleanup.
- Verification cannot prove the reported behavior.

## Common Rationalizations
- "The fix is obvious, so no regression test is needed."
- "I can patch the symptom without finding the root cause."
- "This cleanup is nearby, so I should include it."
- "No error output means the bug is fixed."

## Verification
- Bugfixes default to failing-before regression evidence.
- Run the nearest relevant test or equivalent behavior check.
- Run typecheck, build, lint, or broader tests when shared code changes.
- If verification cannot run, state the blocker and residual risk.

## Output Contract
Final response must include:
- Changed files
- Root cause and fix summary
- Verification
- Remaining risks
