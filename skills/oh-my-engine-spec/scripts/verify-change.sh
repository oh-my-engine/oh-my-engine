#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <change-id>" >&2
  exit 1
fi

CHANGE_INPUT="$1"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=/dev/null
. "$SCRIPT_DIR/common.sh"

CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
PROJECT_ROOT=$(pwd)
CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"
CHANGE_SPEC_ROOT="$CHANGE_DIR/specs"
CONFIG_FILE="$PROJECT_ROOT/.oh-my-engine/config.json"

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

if [ ! -d "$CHANGE_SPEC_ROOT" ]; then
  echo "Missing change specs directory: $CHANGE_SPEC_ROOT" >&2
  exit 1
fi

OPEN_TASKS=$(count_open_checkboxes "$CHANGE_DIR/tasks.md")
DONE_TASKS=$(count_done_checkboxes "$CHANGE_DIR/tasks.md")
OPEN_ACCEPTANCE=$(count_open_checkboxes "$CHANGE_DIR/proposal.md")
MISSING_CAPABILITY_SPECS=0
DELTA_COUNT=0
VERIFY_COMMAND_COUNT=0
FAILED_VERIFY_COMMAND=""

for delta_file in "$CHANGE_SPEC_ROOT"/*/spec.md; do
  [ -f "$delta_file" ] || continue
  DELTA_COUNT=$((DELTA_COUNT + 1))
  capability=$(basename "$(dirname "$delta_file")")
  if [ ! -f "$PROJECT_ROOT/openspec/specs/$capability/spec.md" ]; then
    MISSING_CAPABILITY_SPECS=$((MISSING_CAPABILITY_SPECS + 1))
  fi
done

load_memory_context "$MEMORY_FILE"

if [ "$DELTA_COUNT" -eq 0 ] || [ "$OPEN_TASKS" -gt 0 ] || [ "$OPEN_ACCEPTANCE" -gt 0 ] || [ "$MISSING_CAPABILITY_SPECS" -gt 0 ]; then
  write_memory_state \
    "$MEMORY_FILE" \
    "verify_failed" \
    "verify" \
    "$OPEN_TASKS" \
    "$DONE_TASKS" \
    "$OPEN_ACCEPTANCE" \
    ""

  echo "Verification failed for $CHANGE_INPUT" >&2
  echo "Change spec delta files: $DELTA_COUNT" >&2
  echo "Open tasks: $OPEN_TASKS" >&2
  echo "Open acceptance criteria: $OPEN_ACCEPTANCE" >&2
  echo "Missing long-lived capability specs: $MISSING_CAPABILITY_SPECS" >&2
  exit 1
fi

VERIFY_COMMANDS_FILE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-verify.XXXXXX")
trap 'rm -f "$VERIFY_COMMANDS_FILE"' EXIT INT TERM
json_get_string_array "verifyCommands" "$CONFIG_FILE" > "$VERIFY_COMMANDS_FILE"

if [ -s "$VERIFY_COMMANDS_FILE" ]; then
  while IFS= read -r verify_command; do
    [ -n "$verify_command" ] || continue
    VERIFY_COMMAND_COUNT=$((VERIFY_COMMAND_COUNT + 1))
    echo "Running verify command [$VERIFY_COMMAND_COUNT]: $verify_command"
    if ! /bin/sh -c "$verify_command"; then
      FAILED_VERIFY_COMMAND="$verify_command"
      write_memory_state \
        "$MEMORY_FILE" \
        "verify_failed" \
        "verify" \
        "$OPEN_TASKS" \
        "$DONE_TASKS" \
        "$OPEN_ACCEPTANCE" \
        ""

      echo "Verification failed for $CHANGE_INPUT" >&2
      echo "Failed verify command: $FAILED_VERIFY_COMMAND" >&2
      exit 1
    fi
  done < "$VERIFY_COMMANDS_FILE"
fi

write_memory_state \
  "$MEMORY_FILE" \
  "verified" \
  "verify" \
  "$OPEN_TASKS" \
  "$DONE_TASKS" \
  "$OPEN_ACCEPTANCE" \
  ""

echo "Verification passed for $CHANGE_INPUT"
echo "Completed tasks: $DONE_TASKS"
echo "Open tasks: $OPEN_TASKS"
echo "Open acceptance criteria: $OPEN_ACCEPTANCE"
echo "Verify commands run: $VERIFY_COMMAND_COUNT"
