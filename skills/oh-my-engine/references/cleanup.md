# Cleanup Reference

Cleanup should reduce complexity without changing behavior.

- Lock behavior with tests before risky cleanup.
- Prefer deletion and reuse over new abstraction.
- Keep each pass focused on one smell or boundary.
- Do not mix unrelated cleanup with feature or bug work.
- Verify behavior after cleanup, not just formatting.
