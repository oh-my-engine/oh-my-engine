---
description: Implement scoped changes in small verified slices using project rules.
---

# ome-build

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
