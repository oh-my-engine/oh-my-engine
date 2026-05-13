---
description: Run final readiness checks and prepare user-facing handoff or commit notes.
---

# ome-ship

## Purpose
Run final readiness checks and prepare a clean handoff or commit note for the finished change.

## When to Use
- Use when the change is implemented and ready for final checks.
- Use when you need to package the work for handoff or commit.
- Do not use when the task is still being planned or built.

## Inputs
- The completed change and any outstanding risks.
- Relevant verification output or test results.
- Any release, handoff, or commit constraints.

## Process
1. Confirm the change is complete and scoped as expected.
2. Run the final verification that proves readiness.
3. Check for missing documentation, notes, or follow-up items.
4. Summarize the implementation and verification cleanly.
5. Call out any residual risk or known gap explicitly.
6. Prepare the final handoff or commit-oriented summary.
7. Do not reopen the implementation unless a real defect appears.

## Red Flags
- The change still has unresolved correctness issues.
- Final verification has not been run or is inconclusive.
- Important risks are hidden in a vague summary.
- The handoff introduces new scope instead of closing the current one.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Run the final relevant checks.
- Confirm the output matches the changed behavior.
- State what could not be verified and why.
- Confirm the summary is ready for the next owner.

## Output Contract
Final response must include:
- Completion summary
- Verification evidence
- Remaining risks
- Handoff or commit notes
