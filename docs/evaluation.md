# Evaluation and Regression Protocol

Oh My Engine uses two evaluation tracks:

1. deterministic engine correctness, including CLI state, generated files, memory, specs, and platform adapters;
2. downstream Agent effectiveness, measured with paired tasks against an Agent-only baseline.

The deterministic track is the release gate implemented in this repository. Agent A/B evaluation requires configured external models and is intentionally kept separate from offline package verification.

## Commands

```bash
npm ci
npm run evaluate
npm run verify
npm run audit
npm pack --dry-run
```

`npm run evaluate` runs the focused evaluation regressions plus the delivery-run and Spec command suites. `npm run verify` remains the complete typecheck, build, and regression suite.

## Release Gates

- All deterministic tests pass on Windows, Ubuntu, and macOS with Node.js 22 and 24.
- High-severity dependency vulnerabilities are zero.
- A verification-stage delivery run advances only after `ome run verify-command <command>` succeeds. Text registered with `ome run evidence verification_command ...` is preserved as asserted evidence but does not unlock the stage.
- Spec verification commands execute through the host operating system shell.
- Task-specific guidance must not inject unrelated memory for a natural-language query.
- Chinese guidance queries must retrieve task-relevant Chinese memory.
- Adopted learning effectiveness and cleanup must operate on the current Markdown memory format.
- Generated skill quality requires substantive section structure in addition to keyword scores.

## Regression Record

| ID | Baseline failure | Fix | Regression coverage |
| --- | --- | --- | --- |
| EVAL-001 | Skill frontmatter assertions failed on CRLF output | Accept LF and CRLF in platform-generation assertions | `ome-agents.test.ts` |
| EVAL-002 | Copied CLI shortcut could not resolve production dependencies | Give isolated runtime tests an explicit dependency resolution root | `selective-memory.test.ts` |
| EVAL-003 | Update and guidance tests mutated the repository under test | Run stateful commands in isolated temporary workspaces | `ome-cli.test.ts` |
| EVAL-004 | Pure Chinese task input returned unrelated memory | Add Unicode word segmentation and CJK bigrams; reject unrelated natural-language fallback | `evaluation-regressions.test.ts` |
| EVAL-005 | Spec verification used `/bin/sh` on Windows | Execute configured commands using the host shell | `ome-spec-ts.test.ts` |
| EVAL-006 | Delivery verification accepted self-reported text | Add executed verification status and `ome run verify-command` | `ome-cli.test.ts` |
| EVAL-007 | Effectiveness tracking and cleanup read obsolete JSON/JSONL paths | Read and update Markdown memory through the canonical memory store | `evaluation-regressions.test.ts` |
| EVAL-008 | Skill quality could be inflated with keywords | Require substantive lists, numbered process steps, and a concrete purpose | `evaluation-regressions.test.ts` |
| EVAL-009 | Generated skills lost evidence needed for task retrieval | Preserve candidate evidence and current Markdown provenance paths | `selective-memory.test.ts` |
| EVAL-010 | Installed dependencies contained a high-severity `js-yaml` advisory | Upgrade direct and nested patched versions and add an audit gate | `npm run audit` |

## Agent A/B Track

For product-level effectiveness claims, run the same hidden-test task from the same Git revision under these conditions:

- Agent without OME;
- Agent with static OME workflow and rules;
- Agent with OME workflow, relevant memory, and adopted skills.

Use task success rate as the primary metric. Track regressions, unrelated changed files, false completion claims, elapsed time, tokens, tool calls, and human rework as guardrails. Model, reasoning level, permissions, task order, and starting commit must be controlled. Do not treat deterministic CLI tests as evidence that Agent task quality improved.
