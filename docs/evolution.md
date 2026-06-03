# Evolution System

Oh My Engine's evolution system is evidence-based and candidate-first. It does
not rewrite project guidance after every chat, and it does not install generated
skills just because one execution succeeded.

The current model is:

1. Record substantive workflow executions with `ome finish`.
2. Analyze selected execution memory for repeated, reusable patterns.
3. Create learning or skill candidates only when the evidence is meaningful.
4. Verify and adopt candidates before they become durable guidance.

## What Evolution Is

Evolution turns repeated work evidence into reviewable project guidance.

It can produce:

- learning candidates under `.ome/memory/learnings/candidates/`
- adopted learnings under `.ome/memory/learnings/adopted/`
- skill candidates under `.ome/memory/skill-candidates/`
- adopted generated skills under `.ome/generated-skills/`

Execution memory is not evolution by itself. A memory record is just evidence.
Only repeated, useful evidence should become a candidate.

## What Evolution Is Not

Evolution is not:

- a requirement to record every ordinary conversation
- an automatic skill creator for every successful task
- a replacement for verification
- a reason to promote shallow records such as `review current diff`
- an automatic rule or skill installer without review

By default, OME keeps evolution controlled through `candidateOnly`,
`requireVerification`, and disabled `autoApply`.

## Selective Workflow Recording

Lifecycle workflow skills use:

```text
Workflow Completion (SUBSTANTIVE WORK ONLY)
```

Run `ome finish` only after a substantive workflow loop is complete.

Substantive work means at least one of these is true:

- files, code, docs, configs, tests, or generated artifacts changed
- verification was run and the result matters to the task outcome
- the agent produced a durable diagnosis, root cause, fix, decision, or reusable
  learning
- a full bug/build/test/review/ship loop completed with evidence worth
  preserving

Skip `ome finish` when the exchange is:

- ordinary conversation
- a quick explanation
- brainstorming with no durable conclusion
- read-only exploration that found no reusable outcome
- explicitly requested by the user not to record

This keeps memory useful and avoids treating every chat turn as training data.

## Current Flow

```text
workflow command starts session
        |
        v
agent performs substantive work
        |
        v
agent runs ome finish once, with structured evidence when useful
        |
        v
memory gate stores the execution if it has reusable value
        |
        v
ome evolve analyze groups repeated high-value records
        |
        v
learning or skill candidates are created
        |
        v
candidate is reviewed, verified, and adopted before it affects guidance
```

## Meaningful Learning Signals

Successful records are eligible for learning analysis only when they preserve
useful information. Strong signals include:

- `rootCause`
- `evidence`
- `fixSummary`
- `verificationSummary`
- `reusableLearning`
- non-empty errors or failure evidence
- concrete workflow-specific details

Low-information summaries are filtered before learning candidate grouping.
Examples include:

- `current diff`
- `diff`
- `review`
- `execution`
- `done`
- empty or near-empty summaries

The original execution memory may still exist when the workflow record is useful,
but low-information records should not pollute evolution candidates.

## Learning Candidates

Learning candidates capture repeated project knowledge, preferences, or
diagnostic patterns. OME creates them only after enough evidence has accumulated.

Default threshold:

```yaml
evolution:
  thresholds:
    learningCandidateMinEvidence: 3
```

Use:

```bash
ome evolve analyze
ome evolve review
ome evolve verify-learning --slug <learning-slug>
ome evolve adopt-learning --slug <learning-slug>
```

Adopted learnings become part of the reusable project guidance loaded by
downstream workflows.

## Skill Candidates

OME can create skill candidates from repeated successful execution patterns, but
this is intentionally conservative.

A skill candidate must:

- have repeated evidence
- describe a concrete trigger
- include executable steps
- include red flags and scope controls
- require verification
- pass the skill quality gate

Use:

```bash
ome evolve analyze
ome evolve review
ome evolve verify-skill --slug <skill-slug>
ome evolve adopt-skill --slug <skill-slug>
```

Only adopted skills become generated skill artifacts. A candidate is not an
installed skill.

## Configuration

`OME.md` is the preferred configuration file. The current conservative defaults
look like this:

```yaml
memory:
  enabled: true
  captureMode: selective
  allowSources:
    workflow_command: true
    explicit_remember: true
    post_run_promotion: true

evolution:
  enabled: true
  autoApply: false
  requireVerification: true
  candidateOnly: true
  thresholds:
    learningCandidateMinEvidence: 3
    skillCandidateMinEvidence: 3
    adoptedPreferenceMinEvidence: 2
```

These settings mean:

- workflow executions can be recorded when they pass the memory policy
- explicit `ome memory remember` requests can still store preferences or facts
- evolution suggestions remain candidates until reviewed
- automatic application is disabled
- repeated evidence is required before candidates are created

## Quality Gate For Skills

Skill candidates must meet the structure described in
[Skill Quality Gate](skill-quality-gate.md) and [Skill Anatomy](skill-anatomy.md).

Required sections include:

- Purpose
- When to Use
- Inputs
- Process
- Red Flags
- Common Rationalizations
- Verification
- Output Contract

Candidates that are vague, unverifiable, too broad, or encourage skipping tests
are rejected.

## Troubleshooting

### No execution memory was recorded

Check whether there was an active workflow session:

```bash
ls .ome/.session
```

If the work was ordinary conversation or produced no reusable outcome, no
`ome finish` record is expected.

### `ome finish` says there is no active session

Start a workflow first, for example:

```bash
ome build "describe the substantive task"
```

On Windows PowerShell, use the `.cmd` shim if policy blocks npm scripts:

```powershell
cmd.exe /c ome.cmd build "describe the substantive task"
```

### No evolution candidates were generated

Likely causes:

- fewer than the configured evidence threshold
- records were low-information and filtered
- records did not share a reusable pattern
- evolution is disabled in `OME.md`

Run:

```bash
ome evolve analyze
ome evolve review
```

### A candidate looks too generic

Reject it or improve the evidence. Generic candidates should not be adopted.
Skill candidates must pass the quality gate before adoption.

## Summary

OME evolves through a controlled loop:

1. Record only substantive workflow completions.
2. Preserve structured evidence, not raw command noise.
3. Promote only repeated, meaningful records.
4. Keep suggestions as candidates.
5. Verify and adopt before guidance changes.

This keeps the system useful without making every chat turn or shallow review
record part of the evolution signal.
