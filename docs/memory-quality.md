# Memory Quality

OME memory is meant to preserve reusable project knowledge, not raw command noise.
Execution records should explain what happened, why it happened, how it was fixed,
and how the result was verified.

## Selective Workflow Finish

`ome finish` is for substantive workflow completions, not ordinary chat.

Run it when the workflow produced at least one durable outcome:

- code, docs, config, tests, or generated artifacts changed
- verification was run and the result matters
- a root cause, fix, technical decision, or reusable learning was produced
- a complete bug/build/test/review/ship loop has evidence worth preserving

Skip it for quick explanations, casual conversation, inconclusive brainstorming,
or read-only exploration that produced no reusable outcome. This keeps execution
memory from becoming a transcript log.

## Bug Finish Requirements

When a bug workflow is substantive, the record should include at least one core
diagnostic field before it is persisted:

- `--root-cause`
- `--evidence`
- `--fix` or `--fix-summary`
- `--verification`
- `--learning` or `--reusable-learning`

This prevents empty bug memories that contain only a title, status, and a long
`filesTouched` list.

Recommended bug completion:

```powershell
ome finish `
  --root-cause "The matcher accepted stale generated style data" `
  --evidence "Existing pages kept old style rows after the code fix" `
  --fix "Regenerate or refresh the affected page style data" `
  --verification "Rebuilt the page and confirmed the new style output" `
  --learning "Already-generated pages need style data refresh before visual changes appear"
```

If a bug workflow has no core diagnostic field, `ome finish` keeps the active
session and prints guidance instead of writing a low-value memory file. Rerun
`ome finish` with the structured fields above to record the same workflow
session.

## Sessionless Finish

When there is no `.ome/.session`, `ome finish` can still record an ad-hoc memory
if structured diagnostic fields are supplied. A shallow payload such as only
`--symptom` is rejected because it does not preserve reusable knowledge.

Use this path when an agent completed work outside an OME workflow session:

```powershell
ome finish `
  --root-cause "The previous run resumed without an active OME session" `
  --fix "Recorded the completed diagnostic as an ad-hoc execution memory" `
  --verification "Targeted tests passed"
```

## File Lists

Changed files and tests are supporting metadata. Memory rendering truncates long
file and test lists and stores total/omitted counts in frontmatter, so the body
stays focused on diagnosis, fix, verification, and reusable learning.

## Evolution Candidate Quality

Execution memory is not the same as evolution. The evolve analyzer should promote
only repeated records with meaningful signal, such as root cause, evidence, fix,
verification, reusable learning, or concrete workflow details.

Low-information records such as `current diff`, `diff`, `review`, `execution`,
or `done` can remain as execution records when useful for workflow history, but
they should not become learning candidates or generated skill candidates.
