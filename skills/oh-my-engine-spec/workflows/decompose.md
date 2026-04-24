---
workflow: spec-decompose
version: 1.0.0
description: Turn imported change context into standard OpenSpec change artifacts
rules: []
mcps: []
skills: []
---

# Spec Decompose Workflow

## Goal

Convert imported PRD material plus operator intent into proposal, design, tasks, and spec deltas.

## Execution Steps

### Step 1: Load intake context
```
1. Read context/source.md
2. Read context/prompt.md
3. Read context/references.json and context/assets/
4. Load existing capability specs and project rules when available
```

### Step 2: Produce working analysis
```
1. Extract requirements, constraints, and risks into context/analysis.md
2. Convert image findings into text
3. Capture ambiguities and open questions
```

### Step 3: Scaffold OpenSpec artifacts
```
1. Create or refresh proposal.md
2. Create or refresh design.md
3. Create or refresh tasks.md
4. Create or refresh specs/<capability>/spec.md
```

### Step 4: Prepare for planning
```
1. Preserve intake references inside the generated artifacts
2. Mark the change as decomposed in memory
3. Hand off to plan/apply/verify/archive
```
