# Lifecycle Workflows

OME exposes lifecycle commands for general engineering discipline while keeping existing workflow commands compatible.

Commands:

- `ome define "<task>"`: clarify goal, success criteria, scope, open questions, and assumptions.
- `ome plan "<task>"`: produce implementation approach, public API or type changes, data flow, edge cases, and test plan.
- `ome build "<task>"`: guide scoped implementation in small verified slices.
- `ome test "<target>"`: design behavior-focused tests, regression coverage, and failure diagnosis.
- `ome review "<target>"`: review correctness, readability, architecture, security, performance, and test coverage.
- `ome ship "<change>"`: run readiness checks and prepare final handoff or commit notes.

Existing commands map into these phases internally:

- `ome bug`: define unclear issues, test reproduction, build fix, review correctness, ship evidence.
- `ome api`: define contract assumptions, plan data flow, build integration, test contract paths, review security and compatibility.
- `ome ui` and `ome comp`: define UX/component responsibility, plan states, build implementation, test accessibility and responsive behavior, review design consistency.
- `ome spec`: define and plan as artifacts before apply, then verify before archive.
- `ome evolve`: review skill quality before adoption.
