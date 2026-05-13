---
description: Integrate API clients, services, and contracts using project rules.
---

# ome-api

## Purpose
Integrate an API contract or endpoint with typed, maintainable project code while preserving security, compatibility, and error-handling expectations.

## When to Use
- Use for OpenAPI/Swagger files, endpoint descriptions, service clients, request/response types, and API error handling.
- Use when API behavior must align with project conventions.
- Do not use to invent an API contract when requirements are unclear; use `ome define` or `ome plan` first.

## Inputs
- API spec, URL, local file, or endpoint description.
- Existing API clients, service modules, types, mocks, and tests.
- `OME.md`, `.ome/rules/`, and `ome guidance api-integration --input "<api-spec>"`.
- References: `security.md`, `testing.md`, and `performance.md`.

## Process
1. Load OME guidance and project rules before changing code.
2. Identify contract assumptions, auth requirements, error shapes, and compatibility constraints.
3. Reuse existing client, service, type, and mock patterns.
4. Implement the smallest integration slice.
5. Add or update tests for success, error, and boundary cases.
6. Verify type safety, tests, and security-sensitive paths.
7. Report changed files, contract assumptions, verification, and remaining risks.

## Red Flags
- The API contract is incomplete or conflicts with existing code.
- Auth, tenant isolation, or secret handling is ambiguous.
- The implementation requires a new dependency without explicit user approval.
- Generated code would bypass existing error handling or typed contracts.
- Tests cannot cover key success or failure paths.

## Common Rationalizations
- "The spec says it, so no runtime error handling is needed."
- "Generated types are enough verification."
- "This one endpoint can use a different client pattern."
- "Auth details can be wired later."

## Verification
- Run targeted API/client tests or equivalent contract checks.
- Run typecheck when types or public interfaces change.
- Verify error handling, auth-sensitive behavior, and backward compatibility where relevant.
- State any contract assumptions that could not be verified.

## Output Contract
Final response must include:
- Changed files
- Contract and implementation summary
- Verification
- Remaining risks
