#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <change-id>" >&2
  exit 1
fi

CHANGE_INPUT="$1"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
# shellcheck source=/dev/null
. "$SCRIPT_DIR/common.sh"

VERIFY_SCRIPT="$SCRIPT_DIR/verify-change.sh"
CAPABILITY_TEMPLATE="$ROOT_DIR/skills/oh-my-engine-spec/templates/capability-spec.md"
CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
PROJECT_ROOT=$(pwd)
CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"
ARCHIVE_TARGET="$PROJECT_ROOT/openspec/archive/$(utc_stamp)-$CHANGE_SLUG"
PROPOSAL_FILE="$CHANGE_DIR/proposal.md"

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

apply_delta_to_requirement_state() {
  delta_file="$1"
  order_file="$2"
  state_dir="$3"

  change_type=$(delta_change_type "$delta_file")
  req_dir=$(mktemp -d "${TMPDIR:-/tmp}/oh-my-engine-spec-reqs.XXXXXX")

  parse_requirement_blocks "$delta_file" "$req_dir"

  find "$req_dir" -type f | sort | while IFS= read -r req_file; do
    [ -n "$req_file" ] || continue
    req_name=$(basename "$req_file")
    req_slug=${req_name#*-}
    req_slug=${req_slug%.md}

    case "$change_type" in
      remove)
        rm -f "$state_dir/$req_slug.md"
        remove_line_from_file "$order_file" "$req_slug"
        ;;
      add|modify)
        if ! grep -Fqx "$req_slug" "$order_file" 2>/dev/null; then
          printf '%s\n' "$req_slug" >> "$order_file"
        fi
        cp "$req_file" "$state_dir/$req_slug.md"
        ;;
      *)
        echo "Unsupported change type in $delta_file" >&2
        rm -rf "$req_dir"
        exit 1
        ;;
    esac
  done

  rm -rf "$req_dir"
}

build_merged_requirements_body() {
  capability_name="$1"
  current_delta="$2"
  output_file="$3"
  order_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-order.XXXXXX")
  archived_deltas=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-archived-deltas.XXXXXX")
  state_dir=$(mktemp -d "${TMPDIR:-/tmp}/oh-my-engine-spec-state.XXXXXX")

  : > "$order_file"
  find "$PROJECT_ROOT/openspec/archive" -path "*/specs/$capability_name/spec.md" -type f | sort > "$archived_deltas"

  while IFS= read -r archived_delta; do
    [ -n "$archived_delta" ] || continue
    apply_delta_to_requirement_state "$archived_delta" "$order_file" "$state_dir"
  done < "$archived_deltas"

  apply_delta_to_requirement_state "$current_delta" "$order_file" "$state_dir"

  : > "$output_file"
  emitted=0
  while IFS= read -r req_slug; do
    [ -n "$req_slug" ] || continue
    [ -f "$state_dir/$req_slug.md" ] || continue

    if [ "$emitted" -eq 1 ]; then
      printf '\n' >> "$output_file"
    fi
    cat "$state_dir/$req_slug.md" >> "$output_file"
    emitted=1
  done < "$order_file"

  if [ "$emitted" -eq 0 ]; then
    printf 'No accepted requirements promoted yet.\n' > "$output_file"
  else
    printf '\n' >> "$output_file"
  fi

  rm -f "$order_file" "$archived_deltas"
  rm -rf "$state_dir"
}

append_change_block() {
  label="$1"
  change_id="$2"
  delta_file="$3"
  output_file="$4"

  if [ -s "$output_file" ]; then
    printf '\n' >> "$output_file"
  fi

  {
    printf '### %s: %s\n\n' "$label" "$change_id"
    sed 's/^/    /' "$delta_file"
    printf '\n'
  } >> "$output_file"
}

"$VERIFY_SCRIPT" "$CHANGE_INPUT" >/dev/null
DONE_TASKS=$(count_done_checkboxes "$CHANGE_DIR/tasks.md")

for delta_file in "$CHANGE_DIR"/specs/*/spec.md; do
  [ -f "$delta_file" ] || continue
  capability=$(basename "$(dirname "$delta_file")")
  target_file="$PROJECT_ROOT/openspec/specs/$capability/spec.md"
  current_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-current.XXXXXX")
  history_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-history.XXXXXX")
  summary_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-summary-body.XXXXXX")
  requirements_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-requirements-body.XXXXXX")
  compatibility_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-compatibility-body.XXXXXX")
  summary_source=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-summary-source.XXXXXX")
  compatibility_source=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-compat-source.XXXXXX")
  archived_history_paths=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-history-paths.XXXXXX")

  if [ ! -f "$target_file" ]; then
    mkdir -p "$(dirname "$target_file")"
    cp "$CAPABILITY_TEMPLATE" "$target_file"
  fi

  if extract_first_nonempty_section_line "$PROPOSAL_FILE" "## Summary" "$summary_source" || \
     extract_first_nonempty_section_line "$PROPOSAL_FILE" "## Bug Summary" "$summary_source"; then
    cat "$summary_source" > "$summary_file"
    printf '\n' >> "$summary_file"
  else
    printf 'Accepted behavior for capability `%s`.\n' "$capability" > "$summary_file"
  fi

  build_merged_requirements_body "$capability" "$delta_file" "$requirements_file"
  extract_markdown_section "$delta_file" "## Compatibility Notes" "$compatibility_source"
  if awk '
    {
      line = $0
      gsub(/^[[:space:]]+/, "", line)
      gsub(/[[:space:]]+$/, "", line)
      if (line != "") found = 1
    }
    END { exit found ? 0 : 1 }
  ' "$compatibility_source"; then
    cat "$compatibility_source" > "$compatibility_file"
    printf '\n' >> "$compatibility_file"
  else
    printf 'No accepted compatibility notes promoted yet.\n' > "$compatibility_file"
  fi

  replace_markdown_section_body "$target_file" "## Capability Summary" "$summary_file"
  replace_markdown_section_body "$target_file" "## Requirements" "$requirements_file"
  replace_markdown_section_body "$target_file" "## Compatibility Notes" "$compatibility_file"

  : > "$current_file"
  : > "$history_file"
  append_change_block "Latest Accepted Change" "$CHANGE_INPUT" "$delta_file" "$current_file"
  append_change_block "Archived Change" "$CHANGE_INPUT" "$delta_file" "$history_file"

  find "$PROJECT_ROOT/openspec/archive" -path "*/specs/$capability/spec.md" -type f | sort -r > "$archived_history_paths"
  while IFS= read -r archived_delta; do
    [ -n "$archived_delta" ] || continue
    archived_change_dir=$(basename "$(dirname "$(dirname "$(dirname "$archived_delta")")")")
    archived_change_id=${archived_change_dir#*-}
    append_change_block "Archived Change" "$archived_change_id" "$archived_delta" "$history_file"
  done < "$archived_history_paths"

  replace_markdown_section_body "$target_file" "## Current Accepted Delta" "$current_file"
  replace_markdown_section_body "$target_file" "## Change History" "$history_file"

  rm -f \
    "$current_file" \
    "$history_file" \
    "$summary_file" \
    "$requirements_file" \
    "$compatibility_file" \
    "$summary_source" \
    "$compatibility_source" \
    "$archived_history_paths"
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
