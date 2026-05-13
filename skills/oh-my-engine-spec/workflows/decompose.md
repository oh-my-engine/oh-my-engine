---
workflow: spec-decompose
version: 1.1.0
description: Turn imported change context into standard OpenSpec change artifacts, with a mandatory clarification gate before scaffolding.
rules: []
mcps: []
skills: []
---

# Spec Decompose Workflow

## Goal

Convert imported PRD material plus operator intent into proposal, design, tasks, and spec deltas.
Before generating artifacts, evaluate whether requirements are clear enough to drive a technical design.
If they are not, stop and ask — do not generate artifacts on top of ambiguous input.

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
3. Identify and list all ambiguities and open questions
```

### Step 2.5: Clarification Gate (MANDATORY)
```
Evaluate requirement clarity BEFORE proceeding to Step 3.
For each of the following dimensions, rate: CLEAR / VAGUE / MISSING.

  [ ] User goal       — what problem is the user trying to solve?
  [ ] Scope boundary  — what is explicitly out of scope?
  [ ] Acceptance criteria — how will we know it is done?
  [ ] Key constraints — tech stack, performance, security, backward compatibility?
  [ ] Edge cases      — are there known exceptional scenarios?

BLOCKING RULE:
  If ANY dimension is rated MISSING, you MUST STOP HERE.
  - Present the blocking questions to the user in a clear, numbered list.
  - Write the questions into context/analysis.md under "## Blocking Questions".
  - Do NOT proceed to Step 3 until the user has answered all blocking questions.

NON-BLOCKING RULE:
  If a dimension is VAGUE but not MISSING:
  - Document your assumptions in context/analysis.md under "## Assumptions".
  - You MAY proceed to Step 3, but MUST surface these assumptions explicitly
    in proposal.md under "## Unconfirmed Assumptions" for user confirmation.

PASS CONDITION: Zero MISSING dimensions. Proceed to Step 3.
```

### Step 3: Scaffold OpenSpec artifacts
```
Proceed ONLY after passing the Clarification Gate.

1. Create or refresh .ome/omespec/changes/<change-id>/proposal.md
2. Create or refresh .ome/omespec/changes/<change-id>/design.md
3. Create or refresh .ome/omespec/changes/<change-id>/tasks.md
4. Create or refresh .ome/omespec/changes/<change-id>/specs/<capability>/spec.md
```

### Step 4: Prepare for planning
```
1. Preserve intake references inside the generated artifacts
2. Inline confirmed assumptions into proposal.md under "## Confirmed Assumptions"
3. Mark the change as decomposed in memory
4. Hand off to plan/apply/verify/archive
```
