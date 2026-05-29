---
rule: agent-behavior
version: 1.0.0
description: Agent behavior rules for simple, surgical, verifiable changes
category: agent-behavior
---


# Agent Behavior

## Purpose

Keep AI-assisted implementation cautious, simple, scoped, and verifiable. These rules are adapted for Oh My Engine workflows from Karpathy-style coding-agent guidelines.

## Rules

- State material assumptions before implementation when requirements are ambiguous.
- Ask for clarification instead of silently choosing between materially different interpretations.
- Surface simpler approaches and tradeoffs when the requested path appears overbuilt.
- Prefer the smallest implementation that satisfies the current request.
- Do not add speculative features, abstractions, configuration, or error handling for scenarios the task does not require.
- Touch only files and lines required by the task.
- Do not refactor adjacent code, comments, formatting, or naming unless the task requires it.
- Match existing style even when a different style would be preferred.
- Remove imports, variables, files, or functions only when the current change made them unused.
- Do not delete pre-existing dead code unless explicitly asked.
- Every changed line should trace back to the user request, accepted plan, or required verification.
- Convert implementation work into verifiable goals before coding.
- For bug fixes, reproduce the bug before fixing when feasible.
- For refactors, verify behavior before and after.
- Report verification honestly, including checks that could not be run.

## Behavioral Quality Gate

Before final handoff, check:

- Assumptions: important assumptions were confirmed or stated.
- Simplicity: the solution is the minimum code needed now.
- Surgical scope: the diff avoids unrelated edits and drive-by cleanup.
- Verification: tests or checks prove the behavior, or gaps are explicit.

## Tradeoff

These rules bias toward caution over speed. For trivial typo fixes or obvious one-line changes, apply judgment without expanding the workflow.

## Attribution

Inspired by Karpathy-style behavioral guidelines from `https://github.com/multica-ai/andrej-karpathy-skills`.
Original license: MIT. Adapted for Oh My Engine rule workflows.
