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
1. Check for .ome/config.json
2. Check whether .ome/omespec/ already exists
3. Detect project conventions and relevant rules
```

### Step 2: Create workspace
```
1. Create .ome/omespec/project.md
2. Create .ome/omespec/changes/
3. Create .ome/omespec/specs/
4. Create .ome/omespec/archive/
5. Create .ome/memory/specs/
```

### Step 3: Seed configuration
```
1. Add spec workflow settings to .ome/config.json
2. Keep existing workflows untouched
3. Prefer documentation-first defaults
```

## Output

```json
{
  "success": true,
  "created": [
    ".ome/omespec/project.md",
    ".ome/omespec/changes/",
    ".ome/omespec/specs/",
    ".ome/omespec/archive/",
    ".ome/memory/specs/"
  ]
}
```
