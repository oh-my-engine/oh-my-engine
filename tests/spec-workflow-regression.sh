#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
# shellcheck source=/dev/null
. "$ROOT_DIR/skills/oh-my-engine-spec/scripts/common.sh"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_eq() {
  expected="$1"
  actual="$2"
  if [ "$expected" != "$actual" ]; then
    echo "Expected: $expected" >&2
    echo "Actual:   $actual" >&2
    fail "values differ"
  fi
}

assert_contains() {
  needle="$1"
  file="$2"

  if ! grep -Fq "$needle" "$file"; then
    echo "Expected to find: $needle" >&2
    sed -n '1,260p' "$file" >&2
    fail "missing expected content"
  fi
}

assert_not_contains() {
  needle="$1"
  file="$2"

  if grep -Fq "$needle" "$file"; then
    echo "Did not expect to find: $needle" >&2
    sed -n '1,260p' "$file" >&2
    fail "unexpected content present"
  fi
}

extract_section() {
  heading="$1"
  file="$2"
  output="$3"

  awk -v heading="$heading" '
    $0 == heading { in_section = 1; next }
    in_section && /^## / { exit }
    in_section { print }
  ' "$file" > "$output"
}

create_workspace() {
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/oh-my-engine-spec-regression.XXXXXX")
  cp -R "$ROOT_DIR/skills" "$tmpdir"
  printf '%s\n' "$tmpdir"
}

write_common_design() {
  workspace="$1"
  change="$2"
  cat > "$workspace/openspec/changes/$change/design.md" <<EOF
# Technical Design

## Overview
Implement the accepted auth behavior for $change.

## Architecture
- Components involved: auth guard, request router
- Boundaries: protected routes use the guard, public routes bypass it
- Data flow: request -> auth guard -> handler

## Interfaces
### Public/API Interfaces
- Endpoint or command: protected HTTP routes
- Input: request headers with session token
- Output: handler response or 401

### Internal Interfaces
- Module: auth guard middleware
- Responsibility: stop unauthorized requests before handlers run

## Data Model
- New entities: none
- Changed entities: protected route metadata
- Migration concerns: none

## Failure Modes
- Failure mode: auth provider timeout
  Handling: fail closed with a structured error log

## Risks and Tradeoffs
- Tradeoff: one extra guard hop per protected request
- Rejected alternative: duplicate auth checks in each handler

## Verification Plan
- Unit: auth guard accepts valid tokens and rejects missing tokens
- Integration: protected routes require auth while public routes stay open
- Manual: call one protected and one public route locally
EOF
}

prepare_change() {
  workspace="$1"
  change="$2"
  capability="$3"

  cd "$workspace"
  bash skills/oh-my-engine-spec/scripts/propose-change.sh "$change" --capability "$capability" >/dev/null
  bash skills/oh-my-engine-spec/scripts/plan-change.sh "$change" >/dev/null
  bash skills/oh-my-engine-spec/scripts/apply-change.sh "$change" --all-tasks --all-acceptance >/dev/null
}

test_verify_command_parsing_variants() {
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/oh-my-engine-spec-json.XXXXXX")

  cat > "$tmpdir/empty.json" <<'EOF'
{
  "verifyCommands": []
}
EOF
  empty_output=$(json_get_string_array "verifyCommands" "$tmpdir/empty.json" | tr '\n' ',' | sed 's/,$//')
  assert_eq "" "$empty_output"

  cat > "$tmpdir/inline.json" <<'EOF'
{
  "verifyCommands": ["npm test", "npm run lint"]
}
EOF
  inline_output=$(json_get_string_array "verifyCommands" "$tmpdir/inline.json" | tr '\n' ',' | sed 's/,$//')
  assert_eq "npm test,npm run lint" "$inline_output"

  cat > "$tmpdir/multiline.json" <<'EOF'
{
  "verifyCommands": [
    "npm test",
    "npm run lint"
  ]
}
EOF
  multiline_output=$(json_get_string_array "verifyCommands" "$tmpdir/multiline.json" | tr '\n' ',' | sed 's/,$//')
  assert_eq "npm test,npm run lint" "$multiline_output"
}

test_archive_semantic_merge() {
  workspace=$(create_workspace)
  cd "$workspace"
  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null

  prepare_change "$workspace" "auth-guard-add" "auth"
  cat > "$workspace/openspec/changes/auth-guard-add/proposal.md" <<'EOF'
# Change Proposal

## Change ID
`auth-guard-add`

## Summary
Introduce a shared auth guard for protected routes.

## Problem
Protected routes currently duplicate authorization checks.

## Goals
- Centralize route authorization.
- Keep public routes unchanged.

## Non-Goals
- Rebuild session storage.
- Change token formats.

## User Impact
- Protected routes behave consistently for signed-in users.
- Public routes continue to work as before.
- Existing login flow remains unchanged.

## Acceptance Criteria
- [x] Protected routes run through one shared guard.
- [x] Public routes still bypass the guard.

## Risks
- Risk: middleware order could block public routes.
  Mitigation: attach the guard only to protected routes.

## Rollout Notes
- Feature flag: not needed.
- Migration: none.
- Monitoring: watch 401 volume on protected routes.

## Related Capability Specs
- `openspec/specs/auth/spec.md`
EOF
  write_common_design "$workspace" "auth-guard-add"
  cat > "$workspace/openspec/changes/auth-guard-add/specs/auth/spec.md" <<'EOF'
# Spec Delta

## Capability
`auth`

## Change Type
- [x] Add
- [ ] Modify
- [ ] Remove

## Requirements
### Requirement: Shared Protected Route Guard
The system MUST validate protected routes through a shared auth guard before handlers execute.

#### Scenario: Anonymous request is rejected
- **WHEN** an anonymous request reaches a protected route
- **THEN** the auth guard returns a 401 before the handler runs

### Requirement: Public Routes Stay Public
The system SHOULD leave explicitly public routes untouched by the new guard.

#### Scenario: Public route bypasses the guard
- **WHEN** a request reaches a route marked as public
- **THEN** the request continues without auth guard enforcement

## Compatibility Notes
- Backward compatibility: existing public routes keep their current behavior.
- Migration notes: register protected routes with the guard.
- Observability notes: log guard rejections with route metadata.
EOF
  bash skills/oh-my-engine-spec/scripts/verify-change.sh auth-guard-add >/dev/null
  bash skills/oh-my-engine-spec/scripts/archive-change.sh auth-guard-add >/dev/null

  prepare_change "$workspace" "auth-guard-modify" "auth"
  cat > "$workspace/openspec/changes/auth-guard-modify/proposal.md" <<'EOF'
# Change Proposal

## Change ID
`auth-guard-modify`

## Summary
Tighten the auth guard and add structured rejection logging.

## Problem
The initial guard does not log enough detail to debug rejected requests.

## Goals
- Log rejected protected-route requests with route metadata.
- Preserve the shared guard entry point.

## Non-Goals
- Change token issuance.
- Add new authentication providers.

## User Impact
- Protected route failures are easier to debug.
- Signed-in user flow stays unchanged.
- Public routes remain public.

## Acceptance Criteria
- [x] Protected route rejections include structured route metadata.
- [x] Shared guard remains the entry point for protected routes.

## Risks
- Risk: extra logging could increase noisy output.
  Mitigation: log only rejected requests with route metadata.

## Rollout Notes
- Feature flag: not needed.
- Migration: none.
- Monitoring: review auth guard rejection logs after rollout.

## Related Capability Specs
- `openspec/specs/auth/spec.md`
EOF
  write_common_design "$workspace" "auth-guard-modify"
  cat > "$workspace/openspec/changes/auth-guard-modify/specs/auth/spec.md" <<'EOF'
# Spec Delta

## Capability
`auth`

## Change Type
- [ ] Add
- [x] Modify
- [ ] Remove

## Requirements
### Requirement: Shared Protected Route Guard
The system MUST validate protected routes through a shared auth guard before handlers execute and log structured metadata for rejected requests.

#### Scenario: Anonymous request is rejected with context
- **WHEN** an anonymous request reaches a protected route
- **THEN** the auth guard returns a 401 and records the rejected route metadata

### Requirement: Guard Rejections Are Logged
The system MUST emit structured logs whenever the shared auth guard rejects a protected-route request.

#### Scenario: Rejection log is emitted
- **WHEN** the shared auth guard rejects a protected request
- **THEN** a structured rejection log is emitted with route metadata

## Compatibility Notes
- Backward compatibility: the shared guard contract stays the same for callers.
- Migration notes: none.
- Observability notes: add dashboards for guard rejection logs.
EOF
  bash skills/oh-my-engine-spec/scripts/verify-change.sh auth-guard-modify >/dev/null
  bash skills/oh-my-engine-spec/scripts/archive-change.sh auth-guard-modify >/dev/null

  prepare_change "$workspace" "auth-guard-remove-public" "auth"
  cat > "$workspace/openspec/changes/auth-guard-remove-public/proposal.md" <<'EOF'
# Change Proposal

## Change ID
`auth-guard-remove-public`

## Summary
Remove the obsolete public-route exception requirement from the auth capability spec.

## Problem
Public-route behavior is documented elsewhere and no longer belongs in this capability spec.

## Goals
- Remove the obsolete public-route requirement from the auth spec.
- Keep the guard requirements current.

## Non-Goals
- Change public-route code paths.
- Change guard logging.

## User Impact
- Capability docs stop duplicating public-route guarantees.
- Guard behavior stays unchanged.
- Logging behavior stays unchanged.

## Acceptance Criteria
- [x] The obsolete public-route requirement is removed from the auth capability spec.
- [x] Guard requirements remain documented after removal.

## Risks
- Risk: removing the wrong requirement would make the spec incomplete.
  Mitigation: match the requirement by heading and review the merged spec after archive.

## Rollout Notes
- Feature flag: not needed.
- Migration: none.
- Monitoring: none.

## Related Capability Specs
- `openspec/specs/auth/spec.md`
EOF
  write_common_design "$workspace" "auth-guard-remove-public"
  cat > "$workspace/openspec/changes/auth-guard-remove-public/specs/auth/spec.md" <<'EOF'
# Spec Delta

## Capability
`auth`

## Change Type
- [ ] Add
- [ ] Modify
- [x] Remove

## Requirements
### Requirement: Public Routes Stay Public
The system SHOULD leave explicitly public routes untouched by the new guard.

#### Scenario: Public route bypasses the guard
- **WHEN** a request reaches a route marked as public
- **THEN** the request continues without auth guard enforcement

## Compatibility Notes
- Backward compatibility: no runtime behavior changes.
- Migration notes: none.
- Observability notes: none.
EOF
  bash skills/oh-my-engine-spec/scripts/verify-change.sh auth-guard-remove-public >/dev/null
  bash skills/oh-my-engine-spec/scripts/archive-change.sh auth-guard-remove-public >/dev/null

  capability_file="$workspace/openspec/specs/auth/spec.md"
  canonical_requirements="$workspace/canonical-requirements.txt"
  extract_section "## Requirements" "$capability_file" "$canonical_requirements"

  assert_contains "The system MUST validate protected routes through a shared auth guard before handlers execute and log structured metadata for rejected requests." "$capability_file"
  assert_contains "### Requirement: Guard Rejections Are Logged" "$capability_file"
  assert_not_contains "### Requirement: Public Routes Stay Public" "$canonical_requirements"
  assert_contains "### Archived Change: auth-guard-add" "$capability_file"
  assert_contains "### Archived Change: auth-guard-modify" "$capability_file"
  assert_contains "### Archived Change: auth-guard-remove-public" "$capability_file"
}

test_verify_command_parsing_variants
test_archive_semantic_merge

echo "spec workflow regression tests passed"
