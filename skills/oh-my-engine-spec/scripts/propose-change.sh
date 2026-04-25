#!/bin/sh

set -eu

MODE="feature"
CAPABILITY=""
FORCE=0

usage() {
  echo "Usage: $0 <change-id> [--design-first] [--bugfix] [--capability <name>] [--force]" >&2
  exit 1
}

if [ "$#" -lt 1 ]; then
  usage
fi

CHANGE_INPUT="$1"
shift

while [ "$#" -gt 0 ]; do
  case "$1" in
    --design-first)
      MODE="design-first"
      shift
      ;;
    --bugfix)
      MODE="bugfix"
      shift
      ;;
    --capability)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --capability" >&2
        exit 1
      fi
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
# shellcheck source=/dev/null
. "$SCRIPT_DIR/common.sh"

CHANGE_SLUG=$(slugify "$CHANGE_INPUT")
if [ -z "$CHANGE_SLUG" ]; then
  echo "Invalid change id: $CHANGE_INPUT" >&2
  exit 1
fi

if [ -z "$CAPABILITY" ]; then
  CAPABILITY="$CHANGE_SLUG"
fi
CAPABILITY_SLUG=$(slugify "$CAPABILITY")

ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
INIT_SCRIPT="$SCRIPT_DIR/init-workspace.sh"

PROJECT_ROOT=$(pwd)
ensure_workspace_exists "$PROJECT_ROOT" "$INIT_SCRIPT"

CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
CHANGE_SPEC_DIR="$CHANGE_DIR/specs/$CAPABILITY_SLUG"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"

if [ -e "$CHANGE_DIR" ] && [ "$FORCE" -ne 1 ]; then
  if [ -f "$CHANGE_DIR/proposal.md" ] || [ -f "$CHANGE_DIR/design.md" ] || [ -f "$CHANGE_DIR/tasks.md" ] || [ -d "$CHANGE_DIR/specs" ]; then
    echo "Change already exists: $CHANGE_DIR" >&2
    echo "Use --force to overwrite." >&2
    exit 1
  fi
fi

mkdir -p "$CHANGE_SPEC_DIR"
mkdir -p "$PROJECT_ROOT/.oh-my-engine/memory/specs"

proposal_template="$ROOT_DIR/skills/oh-my-engine-spec/templates/proposal.md"
if [ "$MODE" = "bugfix" ]; then
  proposal_template="$ROOT_DIR/skills/oh-my-engine-spec/templates/bugfix-proposal.md"
fi

render_template() {
  src="$1"
  dest="$2"
  sed \
    -e "s/<change-id>/$CHANGE_INPUT/g" \
    -e "s/<change-slug>/$CHANGE_SLUG/g" \
    -e "s/<capability>/$CAPABILITY_SLUG/g" \
    "$src" > "$dest"
}

mkdir -p "$CHANGE_DIR"

if [ "$FORCE" -eq 1 ]; then
  rm -f "$CHANGE_DIR/proposal.md" "$CHANGE_DIR/design.md" "$CHANGE_DIR/tasks.md"
  rm -rf "$CHANGE_DIR/specs"
  mkdir -p "$CHANGE_SPEC_DIR"
fi

render_template "$proposal_template" "$CHANGE_DIR/proposal.md"
render_template "$ROOT_DIR/skills/oh-my-engine-spec/templates/design.md" "$CHANGE_DIR/design.md"
render_template "$ROOT_DIR/skills/oh-my-engine-spec/templates/tasks.md" "$CHANGE_DIR/tasks.md"
render_template "$ROOT_DIR/skills/oh-my-engine-spec/templates/spec-delta.md" "$CHANGE_SPEC_DIR/spec.md"

if [ "$MODE" = "design-first" ]; then
  {
    echo ""
    echo "## Planning Mode"
    echo "- design-first"
  } >> "$CHANGE_DIR/design.md"
fi

cat > "$MEMORY_FILE" <<EOF
{
  "changeId": "$CHANGE_INPUT",
  "changeSlug": "$CHANGE_SLUG",
  "capability": "$CAPABILITY_SLUG",
  "mode": "$MODE",
  "status": "proposed",
  "phase": "propose",
  "updatedAt": "$(utc_iso)",
  "openTasks": $(count_open_checkboxes "$CHANGE_DIR/tasks.md"),
  "completedTasks": $(count_done_checkboxes "$CHANGE_DIR/tasks.md"),
  "openAcceptanceCriteria": $(count_open_checkboxes "$CHANGE_DIR/proposal.md"),
  "archivedPath": ""
}
EOF

EXECUTION_EVENT_FILE=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-execution.XXXXXX")
cat > "$EXECUTION_EVENT_FILE" <<EOF
{
  "source": "workflow_command",
  "workflow": "spec",
  "phase": "propose",
  "changeId": "$CHANGE_INPUT",
  "changeSlug": "$CHANGE_SLUG",
  "capability": "$CAPABILITY_SLUG",
  "complexity": "high",
  "confidence": "high",
  "sensitivity": "low",
  "reusePotential": 0.8,
  "stability": 0.8,
  "novelty": 0.7,
  "status": "proposed",
  "summary": "Scaffolded a spec change and initialized project memory.",
  "filesTouched": [
    "openspec/changes/$CHANGE_SLUG/proposal.md",
    "openspec/changes/$CHANGE_SLUG/design.md",
    "openspec/changes/$CHANGE_SLUG/tasks.md",
    "openspec/changes/$CHANGE_SLUG/specs/$CAPABILITY_SLUG/spec.md",
    ".oh-my-engine/memory/specs/$CHANGE_SLUG.json"
  ],
  "testsRun": [],
  "errors": [],
  "metadata": {
    "mode": "$MODE"
  }
}
EOF

node "$ROOT_DIR/skills/oh-my-engine/scripts/record-execution-memory.js" \
  --project-root "$PROJECT_ROOT" \
  --event-file "$EXECUTION_EVENT_FILE" >/dev/null
rm -f "$EXECUTION_EVENT_FILE"

echo "Created change scaffold:"
echo "  - openspec/changes/$CHANGE_SLUG/proposal.md"
echo "  - openspec/changes/$CHANGE_SLUG/design.md"
echo "  - openspec/changes/$CHANGE_SLUG/tasks.md"
echo "  - openspec/changes/$CHANGE_SLUG/specs/$CAPABILITY_SLUG/spec.md"
echo "  - .oh-my-engine/memory/specs/$CHANGE_SLUG.json"
