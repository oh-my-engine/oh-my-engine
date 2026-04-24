---
workflow: spec-import
version: 1.0.0
description: Import PRD source material and operator intent into change-local context artifacts
rules: []
mcps: []
skills: []
---

# Spec Import Workflow

## Goal

Normalize incoming PRD material before decomposition starts.

## Execution Steps

### Step 1: Collect source inputs
```
1. Accept source text, source files, URLs, or normalized MCP output
2. Accept operator prompt input when provided
3. Accept image or attachment files that belong to the change
```

### Step 2: Persist normalized context
```
1. Write context/source.md
2. Write context/prompt.md
3. Copy attachments into context/assets/
4. Write context/references.json
```

### Step 3: Record intake state
```
1. Mark the change as imported in memory
2. Preserve provenance for later review
3. Stop before proposal/design/tasks are generated
```
