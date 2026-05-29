---
name: ome-superpowers
version: 1.0.0
description: Install, update, or inspect Superpowers bridge entries for supported Agent editors.
author: oh-my-engine
tags: [ome, superpowers, workflow]
---

# ome-superpowers

## Purpose
Install, update, or inspect Superpowers bridge entries for supported Agent editors.

## When to Use
- Use when the user wants Superpowers installed or refreshed.
- Use when the editor-specific bridge needs inspection or repair.
- Do not use when the task is unrelated to Superpowers integration.

## Inputs
- The target editors and install location.
- Any existing bridge or wrapper state in the user home directory.
- The Superpowers repository or release source when updates are required.

## Process
1. Check the current install or doctor state first.
2. Prefer the native installer or bridge path for each supported editor.
3. Write or refresh the wrapper only when native support is not available.
4. Keep the bridge files consistent with the source repository.
5. Verify the install state after writing.
6. Report the platform coverage and any manual follow-up steps.
7. Do not copy unrelated third-party sources into the project rules.

## Red Flags
- A native install path exists but the wrapper is used anyway.
- The bridge would copy external sources into project rules.
- The user home paths are not checked before writing.
- The install state cannot be verified after the change.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Run the doctor or status command after install/update.
- Confirm the expected platform targets exist.
- State any native installer step that remains manual.
- Record any home-directory path assumptions.

## Output Contract
Final response must include:
- Installed or updated targets
- Doctor or status result
- Manual follow-up steps
- Remaining risks
