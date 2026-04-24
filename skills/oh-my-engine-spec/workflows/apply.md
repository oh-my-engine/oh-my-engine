---
workflow: spec-apply
version: 1.0.0
description: Execute implementation using current change docs and long-lived specs
rules: []
mcps: []
skills: []
---

# Spec Apply Workflow

## Goal

Implement a change while treating specs as the source of truth.

## Execution Steps

### Step 1: Load context
```
1. Load .oh-my-engine/config.json
2. Load openspec/project.md
3. Load context/source.md, context/prompt.md, and context/analysis.md when present
4. Load proposal.md, design.md, tasks.md
5. Load related long-lived capability specs
6. Load project rules and memory
```

### Step 2: Execute tasks
```
1. Complete tasks in order
2. Keep docs in sync with behavior changes
3. Update task status as work lands
```
