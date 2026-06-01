---
description: Generate reusable components using project code and design rules.
---

# ome-comp

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome comp $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd comp $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome comp $ARGUMENTS
```

## Purpose
Create or update a reusable component that matches the project structure, design system, accessibility expectations, and test style.

## When to Use
- Use for new reusable UI components, component variants, or component API updates.
- Use when component behavior, props, states, or styling must follow project rules.
- Do not use for full-page redesigns or design-source restoration; use `ome-ui` for design restoration.

## Inputs
- Component name, responsibility, expected states, and props.
- Existing component patterns, tests, style files, and exports.
- `OME.md`, `.ome/rules/`, and `ome guidance component-gen --input "<component-name>"`.
- References: `accessibility.md` and `code-review.md`.

## Process
1. Load OME guidance and project rules before changing code.
2. Inspect nearby components for naming, props, styling, tests, and export patterns.
3. Define the component responsibility, public props, states, and non-goals.
4. Implement the smallest reusable component surface.
5. Add or update behavior/rendering coverage appropriate to the project.
6. Verify typecheck, tests, accessibility basics, and exports.
7. Report changed files, component API, verification, and remaining risks.

## Red Flags
- The component API is unclear or overlaps an existing component.
- The implementation introduces a new design system or dependency.
- Text, focus behavior, or interaction states cannot be verified.
- The change expands into unrelated layout or page work.

## Common Rationalizations
- "This component is visual, so tests are optional."
- "A new abstraction will be useful later."
- "Existing components are close enough; no need to inspect them."
- "Accessibility can be checked after implementation."

## Verification
- Run relevant rendering, interaction, typecheck, or build checks.
- Verify expected states and accessibility basics.
- If visual verification is needed but unavailable, state that gap.

## Output Contract
Final response must include:
- Changed files
- Component API and behavior summary
- Verification
- Remaining risks

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
