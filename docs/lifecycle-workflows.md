# Lifecycle Workflows

OME exposes lifecycle commands for general engineering discipline while keeping existing workflow commands compatible.

## Usage Modes

### Manual Command Invocation

When you know exactly which stage you need:

```bash
/ome-define "add user login"
/ome-plan "implement login API"
/ome-build "create login form"
/ome-test "verify login flow"
/ome-review "review login code"
/ome-ship "prepare commit"
```

### AI Automatic Stage Detection

When you provide a task without specifying the stage, AI should automatically identify which lifecycle stage is appropriate:

**User Input → AI Detection:**
- "Add user login" → Recognizes as new feature with unclear requirements → Uses `/ome-define`
- "How to implement login API?" → Recognizes as design question → Uses `/ome-plan`
- "Start coding the login form" → Recognizes as implementation → Uses `/ome-build`
- "Login button not working" → Recognizes as bug → Uses `/ome-test` or `/ome-bug`
- "Check the login code" → Recognizes as review → Uses `/ome-review`
- "Ready to commit login feature" → Recognizes as delivery → Uses `/ome-ship`

**Key Principle:**

All workflow commands include this discipline:

```markdown
Skill anatomy discipline:
- Start by deciding whether the task is define, plan, build, test, review, or ship work.
- Name assumptions before relying on them.
- Stop and surface concrete conflicts when requirements, code, tests, or rules disagree.
```

This means AI should **always judge the stage first** before proceeding with any task.

### Existing Workflow Integration

Existing task-specific workflows (`ome-bug`, `ome-ui`, `ome-api`, `ome-comp`) internally map to lifecycle stages:

```
ome bug → define (if unclear) → test (reproduction) → build (fix) → review → ship
ome api → define (contract) → plan (data flow) → build → test (contract) → review (security)
ome ui  → define (UX target) → plan (states) → build → test (accessibility) → review
ome comp → define (responsibility) → plan (props/types) → build → test → review
```

## Commands

- `ome define "<task>"`: clarify goal, success criteria, scope, open questions, and assumptions.
- `ome plan "<task>"`: produce implementation approach, public API or type changes, data flow, edge cases, and test plan.
- `ome build "<task>"`: guide scoped implementation in small verified slices.
- `ome test "<target>"`: design behavior-focused tests, regression coverage, and failure diagnosis.
- `ome review "<target>"`: review correctness, readability, architecture, security, performance, and test coverage.
- `ome ship "<change>"`: run readiness checks and prepare final handoff or commit notes.

## Workflow Mapping

Existing commands map into these phases internally:

- `ome bug`: define unclear issues, test reproduction, build fix, review correctness, ship evidence.
- `ome api`: define contract assumptions, plan data flow, build integration, test contract paths, review security and compatibility.
- `ome ui` and `ome comp`: define UX/component responsibility, plan states, build implementation, test accessibility and responsive behavior, review design consistency.
- `ome spec`: define and plan as artifacts before apply, then verify before archive.
- `ome evolve`: review skill quality before adoption.

## Best Practices

### When to Use Manual Commands

- You want strict control over the workflow
- Need to pause at a specific stage for discussion
- Want to skip certain stages (e.g., requirements are clear, go straight to build)

### When to Let AI Auto-Detect

- You're not sure which stage to start with
- Want AI to guide you through the complete process
- Prefer a conversational approach

### Flexible Stage Jumping

You don't have to follow the linear sequence. You can:
- Skip `define` if requirements are crystal clear
- Jump directly to `review` if code is already written
- Use `test` independently for regression checks
- Use `ship` for final verification before commit

The lifecycle stages are **guidance, not constraints**.
