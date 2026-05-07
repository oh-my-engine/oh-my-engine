# OME Skill Anatomy

OME skills use one consistent structure so agents can execute, verify, and evolve them without vague interpretation.

Required sections:

- `Purpose`: the problem the skill solves and the value of a completed run.
- `When to Use`: triggers, suitable tasks, and non-goals.
- `Inputs`: user input, project files, rules, tests, and optional external context.
- `Process`: ordered executable steps.
- `Red Flags`: conditions that require stopping, narrowing, or surfacing a conflict.
- `Common Rationalizations`: shortcuts the agent must reject.
- `Verification`: evidence required before claiming completion.
- `Output Contract`: fields the final response must include.

Generated skills must meet the same anatomy. A candidate that lacks verification, scope control, or concrete triggers is not eligible for adoption.
