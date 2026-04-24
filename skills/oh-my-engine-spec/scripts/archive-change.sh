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

VERIFY_SCRIPT="$SCRIPT_DIR/verify-change.sh"
CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
PROJECT_ROOT=$(pwd)
CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"
ARCHIVE_TARGET="$PROJECT_ROOT/openspec/archive/$(utc_stamp)-$CHANGE_SLUG"

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

"$VERIFY_SCRIPT" "$CHANGE_INPUT" >/dev/null
DONE_TASKS=$(count_done_checkboxes "$CHANGE_DIR/tasks.md")

for delta_file in "$CHANGE_DIR"/specs/*/spec.md; do
  [ -f "$delta_file" ] || continue
  capability=$(basename "$(dirname "$delta_file")")
  target_file="$PROJECT_ROOT/openspec/specs/$capability/spec.md"
  current_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-current.XXXXXX")
  history_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-history.XXXXXX")
  existing_history=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-existing-history.XXXXXX")

  if [ ! -f "$target_file" ]; then
    echo "Missing long-lived capability spec: $target_file" >&2
    exit 1
  fi

  ensure_capability_sections "$target_file"

  cat > "$current_file" <<EOF
### Latest Accepted Change: $CHANGE_INPUT

EOF
  cat "$delta_file" >> "$current_file"
  printf '\n' >> "$current_file"

  cat > "$history_file" <<EOF
### Archived Change: $CHANGE_INPUT

EOF
  cat "$delta_file" >> "$history_file"
  printf '\n' >> "$history_file"

  extract_marker_block \
    "$target_file" \
    "<!-- OH-MY-ENGINE:HISTORY:START -->" \
    "<!-- OH-MY-ENGINE:HISTORY:END -->" \
    "$existing_history"

  if grep -Fq "No archived changes yet." "$existing_history"; then
    : > "$existing_history"
  fi

  if [ -s "$existing_history" ]; then
    cat "$existing_history" >> "$history_file"
  fi

  replace_marker_block \
    "$target_file" \
    "<!-- OH-MY-ENGINE:CURRENT-DELTA:START -->" \
    "<!-- OH-MY-ENGINE:CURRENT-DELTA:END -->" \
    "$current_file"

  replace_marker_block \
    "$target_file" \
    "<!-- OH-MY-ENGINE:HISTORY:START -->" \
    "<!-- OH-MY-ENGINE:HISTORY:END -->" \
    "$history_file"

  rm -f "$current_file" "$history_file" "$existing_history"
done

mv "$CHANGE_DIR" "$ARCHIVE_TARGET"

load_memory_context "$MEMORY_FILE"
write_memory_state \
  "$MEMORY_FILE" \
  "archived" \
  "archive" \
  0 \
  "$DONE_TASKS" \
  0 \
  "openspec/archive/$(basename "$ARCHIVE_TARGET")"

echo "Archived change: $CHANGE_INPUT"
echo "Archive location: openspec/archive/$(basename "$ARCHIVE_TARGET")"
