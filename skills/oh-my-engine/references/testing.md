# Testing Reference

Use tests to prove behavior, not implementation trivia.

- Bug fixes default to a failing reproduction test before the fix unless an equivalent verification is more appropriate.
- Prefer assertions on user-visible behavior, state, outputs, errors, or contracts.
- Keep tests close to the changed behavior and scale coverage with blast radius.
- Run the narrowest useful check first, then broader checks before final handoff.
- If a check cannot run, report the exact blocker and remaining risk.
