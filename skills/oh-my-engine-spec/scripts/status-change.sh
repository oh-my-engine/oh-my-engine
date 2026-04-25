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

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

load_memory_context "$MEMORY_FILE"
STATUS=$(json_get_string "status" "$MEMORY_FILE")
PHASE=$(json_get_string "phase" "$MEMORY_FILE")
UPDATED_AT=$(json_get_string "updatedAt" "$MEMORY_FILE")
ARCHIVED_PATH=$(json_get_string "archivedPath" "$MEMORY_FILE")

echo "Change: $MEMORY_CHANGE_ID"
echo "Slug: $MEMORY_CHANGE_SLUG"
echo "Capability: $MEMORY_CAPABILITY"
echo "Mode: $MEMORY_MODE"
echo "Status: $STATUS"
echo "Phase: $PHASE"
echo "Updated: $UPDATED_AT"

if [ -n "$ARCHIVED_PATH" ]; then
  echo "Archive: $ARCHIVED_PATH"
fi

if [ -d "$CHANGE_DIR" ]; then
  if [ -d "$CHANGE_DIR/context" ]; then
    echo "Intake context: present"
    [ -f "$CHANGE_DIR/context/source.md" ] && echo "  - source.md"
    [ -f "$CHANGE_DIR/context/prompt.md" ] && echo "  - prompt.md"
    [ -f "$CHANGE_DIR/context/analysis.md" ] && echo "  - analysis.md"
    if [ -f "$CHANGE_DIR/context/engine-memory.md" ]; then
      echo "  - engine-memory.md"
      echo "Execution directives: $(count_engine_memory_directives "$CHANGE_DIR/context/engine-memory.md")"
    fi
    if [ -d "$CHANGE_DIR/context/assets" ]; then
      ASSET_COUNT=$(find "$CHANGE_DIR/context/assets" -maxdepth 1 -type f | wc -l | tr -d ' ')
      echo "  - assets: $ASSET_COUNT"
    fi
  fi

  OPEN_TASKS=0
  DONE_TASKS=0
  OPEN_ACCEPTANCE=0
  if [ -f "$CHANGE_DIR/tasks.md" ]; then
    OPEN_TASKS=$(count_open_checkboxes "$CHANGE_DIR/tasks.md")
    DONE_TASKS=$(count_done_checkboxes "$CHANGE_DIR/tasks.md")
  fi
  if [ -f "$CHANGE_DIR/proposal.md" ]; then
    OPEN_ACCEPTANCE=$(count_open_checkboxes "$CHANGE_DIR/proposal.md")
  fi

  echo "Open tasks: $OPEN_TASKS"
  echo "Completed tasks: $DONE_TASKS"
  echo "Open acceptance criteria: $OPEN_ACCEPTANCE"

  if [ "$OPEN_TASKS" -gt 0 ] && [ -f "$CHANGE_DIR/tasks.md" ]; then
    echo "Pending task items:"
    list_open_checkboxes "$CHANGE_DIR/tasks.md" | sed 's/^/  - /'
  fi
else
  echo "Active change directory: not present"
fi
