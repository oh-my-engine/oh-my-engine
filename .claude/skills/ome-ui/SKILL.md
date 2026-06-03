---
name: ome-ui
version: 1.0.0
description: Restore UI components from a design source with project design rules.
author: oh-my-engine
tags: [ome, ui, design, workflow]
---

# ome-ui

## Workflow Session Start (MANDATORY)

Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:

```bash
ome ui $ARGUMENTS
```

This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.

If a Windows PowerShell policy blocks the `ome` shim, run the same step through the cross-shell fallback: `cmd.exe /c ome.cmd ui $ARGUMENTS`. Do not hardcode this fallback on non-Windows platforms.

Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):

```
!ome ui $ARGUMENTS
```

## Purpose
Restore or implement UI from a design source while preserving project layout, theme, i18n, accessibility, responsiveness, and component conventions.

## When to Use
- Use for Figma, MasterGo, screenshots, design descriptions, or UI restoration requests.
- Use when the output is a concrete UI component, view, or interaction.
- Do not use for generic component scaffolding without a design target; use `ome-comp`.

## Inputs
- Design URL, screenshot, description, or component target.
- Existing UI components, styles, tokens, routes, tests, and screenshots if available.
- `OME.md`, `.ome/rules/`, and `ome guidance ui-restore --input "<design-source>"`.
- References: `accessibility.md` and `testing.md`.

## Process
1. Load OME guidance and project rules before changing code.
2. Identify the design target, required states, responsive behavior, and asset needs.
3. Inspect existing UI patterns, tokens, typography, spacing, i18n, and test style.
4. Implement the smallest faithful UI slice using existing project conventions.
5. Verify responsive behavior, accessibility basics, and relevant tests.
6. If visual tooling is available, inspect the rendered result before final handoff.
7. Report changed files, UI behavior, verification, and remaining risks.

## Red Flags
- The design source is inaccessible or missing critical state details.
- The implementation would invent a new theme, token system, or layout framework.
- Text overlaps, controls lack accessible names, or keyboard behavior is broken.
- The requested UI conflicts with existing project rules.

## Common Rationalizations
- "The screenshot looks close enough without running it."
- "Accessibility can wait until after visual matching."
- "A one-off style is faster than using project tokens."
- "Responsive behavior is obvious from the desktop design."

## Verification
- Run relevant UI tests, typecheck, build, or visual/manual checks.
- Verify responsive constraints and accessibility basics.
- State exact gaps if design data or rendering verification is unavailable.

## Output Contract
Final response must include:
- Changed files
- UI implementation summary
- Verification
- Remaining risks

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
