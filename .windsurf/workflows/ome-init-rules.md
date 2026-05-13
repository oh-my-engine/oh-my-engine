---
description: Refresh scan context, inspect current source code, rewrite .ome/rules, and sync Agent rules.
---

# ome-init-rules

## Purpose
Refresh the local project scan, rewrite repository-specific rules, and keep platform rules in sync.

## When to Use
- Use when the repository has changed enough that the existing `.ome/rules/*.md` are stale.
- Use when you need to personalize rule drafts from the current source tree.
- Do not use when you only need to inspect the current rules without changing them.

## Inputs
- Project root, `OME.md`, `.ome/context/project-scan.json`, and `.ome/context/rules-generation-prompt.md`.
- Representative source files, tests, scripts, configs, and any existing conventions.
- The current `.ome/rules/*.md` files and the target platform rule files.

## Process
1. Read the current scan and prompt before editing any rule file.
2. Inspect representative source files and existing project conventions.
3. Rewrite `.ome/rules/*.md` so they match this repository instead of generic framework advice.
4. Add, rename, or remove rules only when the scan supports the change.
5. Sync platform rule files after editing the source rules.
6. Report the changed rule files and verification commands.
7. Do not create UI, mobile, or design-token rules unless the repository signals them.

## Red Flags
- The scan conflicts with the source code or package scripts.
- A rule would be generic and not tied to the repository.
- The change would invent unnecessary UI or mobile rules.
- The platform sync step is skipped after editing source rules.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Check that the updated rule set matches the scan and source tree.
- Run the relevant sync command and confirm platform rule outputs were regenerated.
- State any rule files or project signals that could not be verified.

## Output Contract
Final response must include:
- Changed rule files
- Scan summary
- Verification commands
- Remaining risks
