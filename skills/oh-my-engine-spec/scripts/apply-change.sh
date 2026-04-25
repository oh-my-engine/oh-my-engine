#!/bin/sh

set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <change-id> [--task <text>] [--undo-task <text>] [--acceptance <text>] [--undo-acceptance <text>] [--all-tasks] [--all-acceptance] [--note <text>]" >&2
  exit 1
fi

CHANGE_INPUT="$1"
shift
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=/dev/null
. "$SCRIPT_DIR/common.sh"

TASKS_DONE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-apply-task-done.XXXXXX")
TASKS_UNDONE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-apply-task-undone.XXXXXX")
ACCEPTANCE_DONE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-apply-acc-done.XXXXXX")
ACCEPTANCE_UNDONE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-apply-acc-undone.XXXXXX")
NOTES_FILE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-apply-notes.XXXXXX")
ENGINE_DIRECTIVES_FILE=""
trap 'rm -f "$TASKS_DONE" "$TASKS_UNDONE" "$ACCEPTANCE_DONE" "$ACCEPTANCE_UNDONE" "$NOTES_FILE" "$ENGINE_DIRECTIVES_FILE"' EXIT INT TERM

ALL_TASKS=0
ALL_ACCEPTANCE=0
HAS_MUTATIONS=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --task)
      [ "$#" -ge 2 ] || exit 1
      printf '%s\n' "$2" >> "$TASKS_DONE"
      HAS_MUTATIONS=1
      shift 2
      ;;
    --undo-task)
      [ "$#" -ge 2 ] || exit 1
      printf '%s\n' "$2" >> "$TASKS_UNDONE"
      HAS_MUTATIONS=1
      shift 2
      ;;
    --acceptance)
      [ "$#" -ge 2 ] || exit 1
      printf '%s\n' "$2" >> "$ACCEPTANCE_DONE"
      HAS_MUTATIONS=1
      shift 2
      ;;
    --undo-acceptance)
      [ "$#" -ge 2 ] || exit 1
      printf '%s\n' "$2" >> "$ACCEPTANCE_UNDONE"
      HAS_MUTATIONS=1
      shift 2
      ;;
    --all-tasks)
      ALL_TASKS=1
      HAS_MUTATIONS=1
      shift
      ;;
    --all-acceptance)
      ALL_ACCEPTANCE=1
      HAS_MUTATIONS=1
      shift
      ;;
    --note)
      [ "$#" -ge 2 ] || exit 1
      printf '%s\n' "$2" >> "$NOTES_FILE"
      HAS_MUTATIONS=1
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
PROJECT_ROOT=$(pwd)
CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "Missing memory file for change: $CHANGE_INPUT" >&2
  exit 1
fi

if [ "$ALL_TASKS" -eq 1 ]; then
  set_all_checkboxes "$CHANGE_DIR/tasks.md" "x"
fi

if [ "$ALL_ACCEPTANCE" -eq 1 ]; then
  set_all_checkboxes "$CHANGE_DIR/proposal.md" "x"
fi

while IFS= read -r task_query; do
  [ -n "$task_query" ] || continue
  if ! set_first_matching_checkbox "$CHANGE_DIR/tasks.md" "$task_query" "x"; then
    echo "Task not found: $task_query" >&2
    exit 1
  fi
done < "$TASKS_DONE"

while IFS= read -r task_query; do
  [ -n "$task_query" ] || continue
  if ! set_first_matching_checkbox "$CHANGE_DIR/tasks.md" "$task_query" " "; then
    echo "Task not found for undo: $task_query" >&2
    exit 1
  fi
done < "$TASKS_UNDONE"

while IFS= read -r item_query; do
  [ -n "$item_query" ] || continue
  if ! set_first_matching_checkbox "$CHANGE_DIR/proposal.md" "$item_query" "x"; then
    echo "Acceptance criterion not found: $item_query" >&2
    exit 1
  fi
done < "$ACCEPTANCE_DONE"

while IFS= read -r item_query; do
  [ -n "$item_query" ] || continue
  if ! set_first_matching_checkbox "$CHANGE_DIR/proposal.md" "$item_query" " "; then
    echo "Acceptance criterion not found for undo: $item_query" >&2
    exit 1
  fi
done < "$ACCEPTANCE_UNDONE"

while IFS= read -r note; do
  [ -n "$note" ] || continue
  append_note_to_tasks "$CHANGE_DIR/tasks.md" "$note"
done < "$NOTES_FILE"

load_memory_context "$MEMORY_FILE"
refresh_engine_memory_context "$PROJECT_ROOT" "$CHANGE_SLUG" "spec"
OPEN_TASKS=$(count_open_checkboxes "$CHANGE_DIR/tasks.md")
DONE_TASKS=$(count_done_checkboxes "$CHANGE_DIR/tasks.md")
OPEN_ACCEPTANCE=$(count_open_checkboxes "$CHANGE_DIR/proposal.md")

write_memory_state \
  "$MEMORY_FILE" \
  "in_progress" \
  "apply" \
  "$OPEN_TASKS" \
  "$DONE_TASKS" \
  "$OPEN_ACCEPTANCE" \
  ""
record_spec_execution_memory \
  "$PROJECT_ROOT" \
  "apply" \
  "in_progress" \
  "Updated spec implementation progress and lifecycle state."

echo "Apply context for change: $CHANGE_INPUT"
echo "Load these files before implementing:"
echo "  - .oh-my-engine/config.json"
echo "  - openspec/project.md"
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
  ENGINE_DIRECTIVES_FILE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-engine-directives.XXXXXX")
  print_engine_memory_directives "$CHANGE_DIR/context/engine-memory.md" > "$ENGINE_DIRECTIVES_FILE"
  if [ -s "$ENGINE_DIRECTIVES_FILE" ]; then
    echo "Execution directives from adopted skills:"
    sed -n '1,120p' "$ENGINE_DIRECTIVES_FILE"
  fi
fi
echo "Pending tasks: $OPEN_TASKS"
echo "Completed tasks: $DONE_TASKS"
echo "Open acceptance criteria: $OPEN_ACCEPTANCE"
if [ "$HAS_MUTATIONS" -eq 1 ]; then
  echo "Progress files updated."
fi
echo "This helper updates lifecycle state and spec progress; code changes remain manual."
