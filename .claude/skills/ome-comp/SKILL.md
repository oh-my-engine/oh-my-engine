---
name: ome-comp
version: 1.0.0
description: Generate reusable components using project code and design rules.
author: oh-my-engine
tags: [ome, component, ui, workflow]
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
