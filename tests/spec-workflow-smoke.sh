#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  needle="$1"
  file="$2"

  if ! grep -Fq "$needle" "$file"; then
    echo "Expected to find: $needle" >&2
    echo "File contents:" >&2
    sed -n '1,240p' "$file" >&2
    fail "missing expected output"
  fi
}

assert_exists() {
  path="$1"
  [ -e "$path" ] || fail "expected path to exist: $path"
}

assert_not_exists() {
  path="$1"
  [ ! -e "$path" ] || fail "expected path to be absent: $path"
}

assert_json_contains() {
  needle="$1"
  file="$2"

  if ! grep -Fq "$needle" "$file"; then
    echo "Expected JSON to contain: $needle" >&2
    sed -n '1,240p' "$file" >&2
    fail "missing expected json content"
  fi
}

create_workspace() {
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/oh-my-engine-spec-test.XXXXXX")
  cp -R "$ROOT_DIR/skills" "$tmpdir"
  printf '%s\n' "$tmpdir"
}

write_intake_inputs() {
  workspace="$1"

  cat > "$workspace/prd.md" <<'EOF'
# User Authentication PRD

The system needs one reusable authentication gate for protected routes.
Public routes must stay publicly reachable.
EOF

  cat > "$workspace/prompt.md" <<'EOF'
Decompose this PRD into one primary auth capability. Keep the tasks small and preserve existing public-route behavior.
EOF

  cat > "$workspace/mockup.png" <<'EOF'
not-a-real-image
EOF
}

write_valid_feature_docs() {
  workspace="$1"

  cat > "$workspace/openspec/changes/demo/proposal.md" <<'EOF'
# Change Proposal

## Change ID
`demo`

## Summary
Add a reusable auth gate for protected routes.

## Problem
Protected routes currently duplicate auth checks in multiple handlers.

## Goals
- Centralize route authentication
- Keep public routes unchanged

## Non-Goals
- Rebuild the session model
- Change token storage

## User Impact
- Authenticated users reach protected routes consistently
- Public routes keep existing behavior
- Login UX remains unchanged

## Acceptance Criteria
- [x] Protected routes reject anonymous requests through one shared gate
- [x] Existing public routes still bypass auth checks

## Risks
- Risk: middleware order could block public endpoints
  Mitigation: scope the gate to protected routes only

## Rollout Notes
- Feature flag: not needed
- Migration: none
- Monitoring: watch protected-route 401 volume

## Related Capability Specs
- `openspec/specs/auth/spec.md`
EOF

  cat > "$workspace/openspec/changes/demo/design.md" <<'EOF'
# Technical Design

## Overview
Add a shared route guard that validates auth before protected handlers run.

## Architecture
- Components involved: route guard, auth service, protected route registry
- Boundaries: public routes skip the guard, protected routes require a valid session
- Data flow: request -> guard -> auth service -> protected handler

## Interfaces
### Public/API Interfaces
- Endpoint or command: protected HTTP routes
- Input: request headers with session token
- Output: 401 for anonymous requests, handler response for valid sessions

### Internal Interfaces
- Module: auth guard middleware
- Responsibility: validate session state before protected handlers execute

## Data Model
- New entities: none
- Changed entities: protected route metadata
- Migration concerns: none

## Failure Modes
- Failure mode: auth service timeout
  Handling: fail closed with a 401 and structured error log

## Risks and Tradeoffs
- Tradeoff: one extra guard hop per protected request
- Rejected alternative: duplicate auth checks in each handler

## Verification Plan
- Unit: guard accepts valid sessions and rejects missing tokens
- Integration: protected routes require auth while public routes remain open
- Manual: hit one protected and one public route in a local environment
EOF

  cat > "$workspace/openspec/changes/demo/specs/auth/spec.md" <<'EOF'
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
- **THEN** the request continues without the auth guard blocking it

## Compatibility Notes
- Backward compatibility: existing public routes keep their current behavior
- Migration notes: register protected routes with the guard
- Observability notes: log guard rejections with route metadata
EOF
}

test_verify_rejects_placeholder_specs() {
  workspace=$(create_workspace)
  cd "$workspace"

  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null
  bash skills/oh-my-engine-spec/scripts/propose-change.sh demo >/dev/null
  bash skills/oh-my-engine-spec/scripts/plan-change.sh demo >/dev/null
  bash skills/oh-my-engine-spec/scripts/apply-change.sh demo --all-tasks --all-acceptance >/dev/null

  stdout_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-test.stdout.XXXXXX")
  stderr_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-test.stderr.XXXXXX")
  trap 'rm -f "$stdout_file" "$stderr_file"' EXIT INT TERM

  if bash skills/oh-my-engine-spec/scripts/verify-change.sh demo >"$stdout_file" 2>"$stderr_file"; then
    fail "verify should fail when placeholders remain"
  fi

  assert_contains "Unresolved template markers still present:" "$stderr_file"
  assert_contains "select exactly one Change Type checkbox" "$stderr_file"
  assert_contains "add at least one concrete requirement statement" "$stderr_file"
  assert_contains "add at least one concrete WHEN/THEN scenario" "$stderr_file"

  rm -f "$stdout_file" "$stderr_file"
  trap - EXIT INT TERM
}

test_import_creates_context_artifacts() {
  workspace=$(create_workspace)
  cd "$workspace"

  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null
  write_intake_inputs "$workspace"

  bash skills/oh-my-engine-spec/scripts/import-change.sh demo \
    --source-file "$workspace/prd.md" \
    --prompt-file "$workspace/prompt.md" \
    --asset "$workspace/mockup.png" \
    --source-type local-doc >/dev/null

  assert_exists "$workspace/openspec/changes/demo/context/source.md"
  assert_exists "$workspace/openspec/changes/demo/context/prompt.md"
  assert_exists "$workspace/openspec/changes/demo/context/references.json"
  assert_exists "$workspace/openspec/changes/demo/context/assets/mockup.png"
  assert_contains "Keep this file as the normalized text source of truth for decomposition." "$workspace/openspec/changes/demo/context/source.md"
  assert_contains "Preserve the emphasis and exclusions in this prompt during decomposition." "$workspace/openspec/changes/demo/context/prompt.md"
  assert_json_contains "\"phase\": \"import\"" "$workspace/.oh-my-engine/memory/specs/demo.json"
  assert_json_contains "\"analysisStatus\": \"pending\"" "$workspace/openspec/changes/demo/context/references.json"
}

test_decompose_prepares_spec_artifacts_from_context() {
  workspace=$(create_workspace)
  cd "$workspace"

  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null
  write_intake_inputs "$workspace"
  bash skills/oh-my-engine-spec/scripts/import-change.sh demo \
    --source-file "$workspace/prd.md" \
    --prompt-file "$workspace/prompt.md" \
    --asset "$workspace/mockup.png" >/dev/null

  bash skills/oh-my-engine-spec/scripts/decompose-change.sh demo --capability auth >/dev/null

  assert_exists "$workspace/openspec/changes/demo/context/analysis.md"
  assert_exists "$workspace/openspec/changes/demo/proposal.md"
  assert_exists "$workspace/openspec/changes/demo/design.md"
  assert_exists "$workspace/openspec/changes/demo/tasks.md"
  assert_exists "$workspace/openspec/changes/demo/specs/auth/spec.md"
  assert_contains "context/source.md" "$workspace/openspec/changes/demo/proposal.md"
  assert_contains "Imported Asset Inventory" "$workspace/openspec/changes/demo/context/analysis.md"
  assert_json_contains "\"phase\": \"decompose\"" "$workspace/.oh-my-engine/memory/specs/demo.json"
}

test_archive_promotes_first_accepted_spec() {
  workspace=$(create_workspace)
  cd "$workspace"

  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null
  bash skills/oh-my-engine-spec/scripts/propose-change.sh demo --capability auth >/dev/null
  bash skills/oh-my-engine-spec/scripts/plan-change.sh demo >/dev/null
  bash skills/oh-my-engine-spec/scripts/apply-change.sh demo --all-tasks --all-acceptance >/dev/null
  write_valid_feature_docs "$workspace"

  assert_not_exists "$workspace/openspec/specs/auth/spec.md"

  bash skills/oh-my-engine-spec/scripts/verify-change.sh demo >/dev/null
  bash skills/oh-my-engine-spec/scripts/archive-change.sh demo >/dev/null

  assert_exists "$workspace/openspec/specs/auth/spec.md"
  assert_contains "Add a reusable auth gate for protected routes." "$workspace/openspec/specs/auth/spec.md"
  assert_contains "### Requirement: Shared Protected Route Guard" "$workspace/openspec/specs/auth/spec.md"
  assert_contains "### Latest Accepted Change: demo" "$workspace/openspec/specs/auth/spec.md"
  assert_contains "### Archived Change: demo" "$workspace/openspec/specs/auth/spec.md"
}

test_force_rebuild_removes_previous_change_scaffold() {
  workspace=$(create_workspace)
  cd "$workspace"

  bash skills/oh-my-engine-init/scripts/init-project.sh >/dev/null
  write_intake_inputs "$workspace"
  bash skills/oh-my-engine-spec/scripts/import-change.sh demo \
    --source-file "$workspace/prd.md" \
    --prompt-file "$workspace/prompt.md" >/dev/null
  bash skills/oh-my-engine-spec/scripts/propose-change.sh demo --capability auth >/dev/null
  bash skills/oh-my-engine-spec/scripts/propose-change.sh demo --capability billing --force >/dev/null

  assert_not_exists "$workspace/openspec/changes/demo/specs/auth/spec.md"
  assert_exists "$workspace/openspec/changes/demo/specs/billing/spec.md"
  assert_exists "$workspace/openspec/changes/demo/context/source.md"
  assert_exists "$workspace/openspec/changes/demo/context/prompt.md"
}

test_verify_rejects_placeholder_specs
test_import_creates_context_artifacts
test_decompose_prepares_spec_artifacts_from_context
test_archive_promotes_first_accepted_spec
test_force_rebuild_removes_previous_change_scaffold

echo "spec workflow smoke tests passed"
