#!/bin/sh

set -eu

usage() {
  echo "Usage: $0 <change-id> [--design-first] [--bugfix] [--capability <name>] [--force]" >&2
  exit 1
}

if [ "$#" -lt 1 ]; then
  usage
fi

CHANGE_INPUT="$1"
shift

MODE="feature"
MODE_SET=0
CAPABILITY=""
FORCE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --design-first)
      MODE="design-first"
      MODE_SET=1
      shift
      ;;
    --bugfix)
      MODE="bugfix"
      MODE_SET=1
      shift
      ;;
    --capability)
      [ "$#" -ge 2 ] || usage
      CAPABILITY="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      ;;
  esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
# shellcheck source=/dev/null
. "$SCRIPT_DIR/common.sh"

CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
if [ -z "$CHANGE_SLUG" ]; then
  echo "Invalid change id: $CHANGE_INPUT" >&2
  exit 1
fi

PROJECT_ROOT=$(pwd)
CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
CONTEXT_DIR="$CHANGE_DIR/context"
ASSET_DIR="$CONTEXT_DIR/assets"
SOURCE_MD="$CONTEXT_DIR/source.md"
PROMPT_MD="$CONTEXT_DIR/prompt.md"
ANALYSIS_MD="$CONTEXT_DIR/analysis.md"
REFERENCES_JSON="$CONTEXT_DIR/references.json"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"
ANALYSIS_TEMPLATE="$ROOT_DIR/skills/oh-my-engine-spec/templates/analysis.md"

ensure_change_exists "$CHANGE_DIR" "$CHANGE_INPUT"

if [ ! -f "$SOURCE_MD" ] && [ ! -d "$ASSET_DIR" ]; then
  echo "Missing intake context for change: $CHANGE_INPUT" >&2
  echo "Run ./scripts/import-change.sh $CHANGE_INPUT first." >&2
  exit 1
fi

if [ -f "$MEMORY_FILE" ]; then
  load_memory_context "$MEMORY_FILE"
else
  MEMORY_CHANGE_ID="$CHANGE_INPUT"
  MEMORY_CHANGE_SLUG="$CHANGE_SLUG"
  MEMORY_CAPABILITY=""
  MEMORY_MODE="feature"
fi

if [ -z "$CAPABILITY" ]; then
  if [ -n "$MEMORY_CAPABILITY" ]; then
    CAPABILITY="$MEMORY_CAPABILITY"
  else
    CAPABILITY="$CHANGE_SLUG"
  fi
fi

if [ "$MODE_SET" -eq 0 ] && [ -n "$MEMORY_MODE" ]; then
  MODE="$MEMORY_MODE"
fi

CAPABILITY_SLUG=$(slugify "$CAPABILITY")

scaffold_needed=0
if [ "$FORCE" -eq 1 ] || [ ! -f "$CHANGE_DIR/proposal.md" ] || [ ! -f "$CHANGE_DIR/design.md" ] || [ ! -f "$CHANGE_DIR/tasks.md" ] || [ ! -f "$CHANGE_DIR/specs/$CAPABILITY_SLUG/spec.md" ]; then
  scaffold_needed=1
fi

run_propose() {
  case "$MODE" in
    design-first)
      if [ "$FORCE" -eq 1 ]; then
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --design-first --capability "$CAPABILITY" --force >/dev/null
      else
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --design-first --capability "$CAPABILITY" >/dev/null
      fi
      ;;
    bugfix)
      if [ "$FORCE" -eq 1 ]; then
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --bugfix --capability "$CAPABILITY" --force >/dev/null
      else
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --bugfix --capability "$CAPABILITY" >/dev/null
      fi
      ;;
    *)
      if [ "$FORCE" -eq 1 ]; then
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --capability "$CAPABILITY" --force >/dev/null
      else
        bash "$SCRIPT_DIR/propose-change.sh" "$CHANGE_INPUT" --capability "$CAPABILITY" >/dev/null
      fi
      ;;
  esac
}

if [ "$scaffold_needed" -eq 1 ]; then
  run_propose
fi

asset_summary=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-decompose-assets.XXXXXX")
trap 'rm -f "$asset_summary"' EXIT INT TERM

if [ -d "$ASSET_DIR" ]; then
  find "$ASSET_DIR" -maxdepth 1 -type f | LC_ALL=C sort | while IFS= read -r asset_file; do
    asset_name=$(basename "$asset_file")
    printf '%s\n' "- \`openspec/changes/$CHANGE_SLUG/context/assets/$asset_name\`"
  done > "$asset_summary"
fi

if [ ! -f "$ANALYSIS_MD" ] || [ "$FORCE" -eq 1 ]; then
  sed \
    -e "s/<change-id>/$CHANGE_INPUT/g" \
    -e "s/<change-slug>/$CHANGE_SLUG/g" \
    -e "s/<capability>/$CAPABILITY_SLUG/g" \
    "$ANALYSIS_TEMPLATE" > "$ANALYSIS_MD"

  {
    printf '\n## Decomposition Notes\n'
    printf '%s\n' "- Translate the imported source and prompt into concrete proposal, design, task, and spec-delta content."
    printf '%s\n' "- Resolve image-derived facts into text before they reach verification."
    printf '%s\n' "- Keep unresolved decisions in the Ambiguities and Open Questions sections until they are closed."
    printf '\n## Imported Asset Inventory\n'
    if [ -s "$asset_summary" ]; then
      cat "$asset_summary"
    else
      printf '%s\n' "- None imported."
    fi
  } >> "$ANALYSIS_MD"
fi

ensure_intake_section() {
  target_file="$1"

  if grep -Fq "## Intake Context" "$target_file"; then
    return 0
  fi

  {
    printf '\n## Intake Context\n'
    printf '%s\n' "- Source: \`openspec/changes/$CHANGE_SLUG/context/source.md\`"
    printf '%s\n' "- Prompt: \`openspec/changes/$CHANGE_SLUG/context/prompt.md\`"
    printf '%s\n' "- Analysis: \`openspec/changes/$CHANGE_SLUG/context/analysis.md\`"
    printf '%s\n' "- References: \`openspec/changes/$CHANGE_SLUG/context/references.json\`"
  } >> "$target_file"
}

ensure_intake_section "$CHANGE_DIR/proposal.md"
ensure_intake_section "$CHANGE_DIR/design.md"
ensure_intake_section "$CHANGE_DIR/tasks.md"

MEMORY_CHANGE_ID="$CHANGE_INPUT"
MEMORY_CHANGE_SLUG="$CHANGE_SLUG"
MEMORY_CAPABILITY="$CAPABILITY_SLUG"
MEMORY_MODE="$MODE"

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

if [ -f "$REFERENCES_JSON" ]; then
  refs_tmp=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-decompose-refs.XXXXXX")
  trap 'rm -f "$asset_summary" "$refs_tmp"' EXIT INT TERM
  awk '
    BEGIN { updated = 0 }
    /"analysisStatus": "pending"/ {
      sub(/"pending"/, "\"decomposed\"")
      updated = 1
    }
    { print }
    END {
      if (!updated) {
        # no-op
      }
    }
  ' "$REFERENCES_JSON" > "$refs_tmp"
  mv "$refs_tmp" "$REFERENCES_JSON"
fi

write_memory_state \
  "$MEMORY_FILE" \
  "decomposed" \
  "decompose" \
  "$OPEN_TASKS" \
  "$DONE_TASKS" \
  "$OPEN_ACCEPTANCE" \
  ""

echo "Decomposed intake context for change: $CHANGE_INPUT"
echo "Prepared:"
echo "  - openspec/changes/$CHANGE_SLUG/context/analysis.md"
echo "  - openspec/changes/$CHANGE_SLUG/proposal.md"
echo "  - openspec/changes/$CHANGE_SLUG/design.md"
echo "  - openspec/changes/$CHANGE_SLUG/tasks.md"
echo "  - openspec/changes/$CHANGE_SLUG/specs/$CAPABILITY_SLUG/spec.md"
echo "Next:"
echo "  1. Replace TBD markers using context/source.md, context/prompt.md, and context/analysis.md"
echo "  2. Run ./scripts/plan-change.sh $CHANGE_INPUT"
