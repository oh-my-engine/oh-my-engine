---
name: ome-review
version: 1.0.0
description: Review correctness, readability, architecture, security, performance, and tests.
author: oh-my-engine
tags: [ome, review, workflow]
---

# ome-review

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
4. Call out maintainability or architecture concerns that matter.
5. Prioritize findings by severity and likelihood.
6. Avoid hand-wavy praise or summary-only responses.
7. End with concrete issues, assumptions, and residual risk.

## Red Flags
- The review does not identify specific files or lines.
- The change alters behavior without sufficient test coverage.
- A security, correctness, or compatibility concern is ignored.
- The review turns into implementation advice instead of findings.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Confirm findings are tied to the actual diff.
- Confirm severity is grounded in real behavior or risk.
- Confirm any missing test or verification concern is stated plainly.
- State if no issues were found and why.

## Output Contract
Final response must include:
- Findings ordered by severity
- Open questions or assumptions
- Concise change summary
- Residual risk
