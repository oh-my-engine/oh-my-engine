---
rule: ome-workflow-completion
version: 1.2.0
category: ome/workflow
priority: reference
severity: info
tags: [ome, workflow, memory, selective-record]
autoApply: false
---

# Oh My Engine Workflow Completion Rule

> Since v1.2, lifecycle skills use `Workflow Completion (SUBSTANTIVE WORK ONLY)`.
> This reference file documents the same policy for humans and rule-sync flows.

## Selective Execution Recording

Run `ome finish` only after a substantive workflow loop is complete. Ordinary chat should not create execution memory.

### Run `ome finish` When

- Files, code, docs, configs, tests, or generated artifacts were changed.
- Verification was run and the result matters to the task outcome.
- A durable technical decision, diagnosis, root cause, fix, or reusable learning was produced.
- A full bug/build/test/review/ship loop completed and has evidence worth preserving.

### Skip `ome finish` When

- The exchange was ordinary conversation or a quick explanation.
- The work was brainstorming with no durable conclusion.
- Read-only exploration found no reusable outcome.
- The user explicitly asked not to record.

### Command

```bash
ome finish
```

Claude Code fast path:

```bash
!ome finish
```

## Evolution Policy

- Execution memory is not the same as evolution.
- Repeated useful records may become learning candidates.
- Low-information records, such as generic `current diff` reviews, should not become evolution candidates.
- Durable adoption still requires verification and explicit review/adoption.
