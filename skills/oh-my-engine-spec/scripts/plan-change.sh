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

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

if ! grep -Fq "## Planning Notes" "$CHANGE_DIR/design.md"; then
  {
    echo ""
    echo "## Planning Notes"
    echo "- Refine boundaries, interfaces, and rollout sequencing here."
  } >> "$CHANGE_DIR/design.md"
fi

load_memory_context "$MEMORY_FILE"
refresh_engine_memory_context "$PROJECT_ROOT" "$CHANGE_SLUG" "spec"
write_memory_state \
  "$MEMORY_FILE" \
  "planned" \
  "plan" \
  "$(count_open_checkboxes "$CHANGE_DIR/tasks.md")" \
  "$(count_done_checkboxes "$CHANGE_DIR/tasks.md")" \
  "$(count_open_checkboxes "$CHANGE_DIR/proposal.md")" \
  ""
record_spec_execution_memory \
  "$PROJECT_ROOT" \
  "plan" \
  "planned" \
  "Refined the spec change plan and updated lifecycle state."

echo "Planned change: $CHANGE_INPUT"
echo "Review:"
if [ -f "$CHANGE_DIR/context/source.md" ]; then
  echo "  - openspec/changes/$CHANGE_SLUG/context/source.md"
fi
if [ -f "$CHANGE_DIR/context/prompt.md" ]; then
  echo "  - openspec/changes/$CHANGE_SLUG/context/prompt.md"
fi
if [ -f "$CHANGE_DIR/context/analysis.md" ]; then
  echo "  - openspec/changes/$CHANGE_SLUG/context/analysis.md"
fi
if [ -f "$CHANGE_DIR/context/engine-memory.md" ]; then
  echo "  - openspec/changes/$CHANGE_SLUG/context/engine-memory.md"
fi
echo "  - openspec/changes/$CHANGE_SLUG/proposal.md"
echo "  - openspec/changes/$CHANGE_SLUG/design.md"
echo "  - openspec/changes/$CHANGE_SLUG/tasks.md"
if [ -f "$PROJECT_ROOT/openspec/specs/$MEMORY_CAPABILITY/spec.md" ]; then
  echo "  - openspec/specs/$MEMORY_CAPABILITY/spec.md"
else
  echo "  - openspec/specs/$MEMORY_CAPABILITY/spec.md (not promoted yet)"
fi
if [ -f "$CHANGE_DIR/context/engine-memory.md" ]; then
  ENGINE_DIRECTIVE_COUNT=$(count_engine_memory_directives "$CHANGE_DIR/context/engine-memory.md")
  if [ "$ENGINE_DIRECTIVE_COUNT" -gt 0 ]; then
    echo "Execution directives from adopted skills:"
    print_engine_memory_directives "$CHANGE_DIR/context/engine-memory.md" | sed -n '1,120p'
  fi
fi
