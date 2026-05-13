---
workflow: spec-archive
version: 1.0.0
description: Merge a completed change into long-lived specs and memory
rules: []
mcps: []
skills: []
---

# Spec Archive Workflow

## Goal

Close the loop by promoting change-level spec deltas into long-lived capability specs.

## Execution Steps

### Step 1: Promote knowledge
```
1. Merge .ome/omespec/changes/<change-id>/specs/* into .ome/omespec/specs/*
2. Preserve important rationale in the long-lived spec
3. Move the completed change under .ome/omespec/archive/
```

### Step 2: Persist memory
```
1. Write execution summary to .ome/memory/specs/<change-id>.json
2. Record notable patterns and residual risks
3. Trigger learning/evolution if thresholds are met
```
