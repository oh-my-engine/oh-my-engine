---
workflow: spec-propose
version: 1.0.0
description: Create a change proposal in an OpenSpec-compatible structure
rules: []
mcps: []
skills: []
---

# Spec Propose Workflow

## Input

- `change_id`
- `mode` (`feature`, `design-first`, `bugfix`)

## Execution Steps

### Step 1: Determine scope
```
1. Pick the affected capability
2. Choose the correct proposal template
3. Capture goals, constraints, and acceptance criteria
```

### Step 2: Create change scaffold
```
1. Create .ome/omespec/changes/<change-id>/proposal.md
2. Create .ome/omespec/changes/<change-id>/design.md
3. Create .ome/omespec/changes/<change-id>/tasks.md
4. Create .ome/omespec/changes/<change-id>/specs/<capability>/spec.md
```

### Step 3: Link long-lived context
```
1. Reference openspec/project.md
2. Reference existing openspec/specs/<capability>/spec.md if present
3. Record unresolved questions in design.md
```
