---
description: Create implementation guidance with interfaces, edge cases, and test strategy.
---

# ome-plan

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
