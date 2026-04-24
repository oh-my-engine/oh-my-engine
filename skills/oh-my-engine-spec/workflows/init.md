---
workflow: spec-init
version: 1.0.0
description: Initialize OpenSpec-compatible workspace for Oh My Engine
rules: []
mcps: []
skills: []
---

# Spec Init Workflow

## Goal

Create an OpenSpec-compatible workspace without introducing a new runtime dependency.

## Execution Steps

### Step 1: Inspect project state
```
1. Check for .oh-my-engine/config.json
2. Check whether openspec/ already exists
3. Detect project conventions and relevant rules
```

### Step 2: Create workspace
```
1. Create openspec/project.md
2. Create openspec/changes/
3. Create openspec/specs/
4. Create openspec/archive/
5. Create .oh-my-engine/memory/specs/
```

### Step 3: Seed configuration
```
1. Add spec workflow settings to .oh-my-engine/config.json
2. Keep existing workflows untouched
3. Prefer documentation-first defaults
```

## Output

```json
{
  "success": true,
  "created": [
    "openspec/project.md",
    "openspec/changes/",
    "openspec/specs/",
    "openspec/archive/",
    ".oh-my-engine/memory/specs/"
  ]
}
```
