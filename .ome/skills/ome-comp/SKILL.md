---
name: ome-comp
version: 1.0.0
description: Generate reusable components using project code and design rules.
author: oh-my-engine
tags: [ome, component, ui, workflow]
---

# ome-comp

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
