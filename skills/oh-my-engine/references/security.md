# Security Reference

Treat trust boundaries as part of the implementation contract.

- Validate and normalize untrusted input at boundaries.
- Preserve authentication, authorization, and tenant isolation rules.
- Avoid logging secrets, tokens, credentials, or private user data.
- Prefer fail-closed behavior for ambiguous access decisions.
- Call out security tradeoffs explicitly when requirements pressure the boundary.
