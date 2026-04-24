#!/bin/sh

set -eu

usage() {
  echo "Usage: $0 <change-id> [--source-file <path> | --source-text <text>] [--prompt-file <path> | --prompt-text <text>] [--asset <path>] [--source-type <type>] [--force]" >&2
  exit 1
}

if [ "$#" -lt 1 ]; then
  usage
fi

CHANGE_INPUT="$1"
shift

SOURCE_FILE=""
SOURCE_TEXT=""
PROMPT_FILE=""
PROMPT_TEXT=""
SOURCE_TYPE="document"
FORCE=0

ASSET_PATHS=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-import-assets.XXXXXX")
trap 'rm -f "$ASSET_PATHS"' EXIT INT TERM

while [ "$#" -gt 0 ]; do
  case "$1" in
    --source-file)
      [ "$#" -ge 2 ] || usage
      SOURCE_FILE="$2"
      shift 2
      ;;
    --source-text)
      [ "$#" -ge 2 ] || usage
      SOURCE_TEXT="$2"
      shift 2
      ;;
    --prompt-file)
      [ "$#" -ge 2 ] || usage
      PROMPT_FILE="$2"
      shift 2
      ;;
    --prompt-text)
      [ "$#" -ge 2 ] || usage
      PROMPT_TEXT="$2"
      shift 2
      ;;
    --asset)
      [ "$#" -ge 2 ] || usage
      printf '%s\n' "$2" >> "$ASSET_PATHS"
      shift 2
      ;;
    --source-type)
      [ "$#" -ge 2 ] || usage
      SOURCE_TYPE="$2"
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

if [ -n "$SOURCE_FILE" ] && [ -n "$SOURCE_TEXT" ]; then
  echo "Choose either --source-file or --source-text, not both." >&2
  exit 1
fi

if [ -n "$PROMPT_FILE" ] && [ -n "$PROMPT_TEXT" ]; then
  echo "Choose either --prompt-file or --prompt-text, not both." >&2
  exit 1
fi

if [ -z "$SOURCE_FILE" ] && [ -z "$SOURCE_TEXT" ] && [ ! -s "$ASSET_PATHS" ]; then
  echo "Import requires source text or at least one asset." >&2
  exit 1
fi

if [ -n "$SOURCE_FILE" ] && [ ! -f "$SOURCE_FILE" ]; then
  echo "Source file not found: $SOURCE_FILE" >&2
  exit 1
fi

if [ -n "$PROMPT_FILE" ] && [ ! -f "$PROMPT_FILE" ]; then
  echo "Prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

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
ensure_workspace_exists "$PROJECT_ROOT" "$SCRIPT_DIR/init-workspace.sh"

CHANGE_DIR="$PROJECT_ROOT/openspec/changes/$CHANGE_SLUG"
CONTEXT_DIR="$CHANGE_DIR/context"
ASSET_DIR="$CONTEXT_DIR/assets"
SOURCE_MD="$CONTEXT_DIR/source.md"
PROMPT_MD="$CONTEXT_DIR/prompt.md"
REFERENCES_JSON="$CONTEXT_DIR/references.json"
MEMORY_FILE="$PROJECT_ROOT/.oh-my-engine/memory/specs/$CHANGE_SLUG.json"
SOURCE_TEMPLATE="$ROOT_DIR/skills/oh-my-engine-spec/templates/source.md"
PROMPT_TEMPLATE="$ROOT_DIR/skills/oh-my-engine-spec/templates/prompt.md"

mkdir -p "$CONTEXT_DIR"
mkdir -p "$PROJECT_ROOT/.oh-my-engine/memory/specs"

if [ "$FORCE" -eq 1 ]; then
  rm -f "$SOURCE_MD" "$PROMPT_MD" "$REFERENCES_JSON"
  rm -rf "$ASSET_DIR"
fi

mkdir -p "$ASSET_DIR"

IMPORT_TIME=$(utc_iso)
SOURCE_REFERENCE="not-provided"
PROMPT_REFERENCE="not-provided"
HAS_PROMPT=0
PROMPT_HASH=""
ATTACHMENTS_LIST=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-import-attachments.XXXXXX")
trap 'rm -f "$ASSET_PATHS" "$ATTACHMENTS_LIST"' EXIT INT TERM

copy_asset_unique() {
  asset_path="$1"
  if [ ! -f "$asset_path" ]; then
    echo "Asset file not found: $asset_path" >&2
    exit 1
  fi

  asset_name=$(basename "$asset_path")
  asset_base=${asset_name%.*}
  asset_ext=""
  if [ "$asset_base" != "$asset_name" ]; then
    asset_ext=".${asset_name##*.}"
  else
    asset_base="$asset_name"
  fi

  candidate="$asset_name"
  counter=2
  while [ -e "$ASSET_DIR/$candidate" ]; do
    candidate="$asset_base-$counter$asset_ext"
    counter=$((counter + 1))
  done

  cp "$asset_path" "$ASSET_DIR/$candidate"
  printf '%s\n' "$candidate"
}

render_metadata_template() {
  src="$1"
  dest="$2"
  source_type="$3"
  imported_at="$4"
  source_reference="$5"

  sed \
    -e "s/<change-id>/$CHANGE_INPUT/g" \
    -e "s/<source-type>/$source_type/g" \
    -e "s|<imported-at>|$imported_at|g" \
    -e "s|<source-reference>|$source_reference|g" \
    -e "s|<prompt-reference>|$source_reference|g" \
    "$src" > "$dest"
}

if [ -n "$SOURCE_FILE" ]; then
  SOURCE_REFERENCE="$SOURCE_FILE"
elif [ -n "$SOURCE_TEXT" ]; then
  SOURCE_REFERENCE="inline-text"
fi

render_metadata_template "$SOURCE_TEMPLATE" "$SOURCE_MD" "$SOURCE_TYPE" "$IMPORT_TIME" "$SOURCE_REFERENCE"
{
  printf '\n~~~text\n'
  if [ -n "$SOURCE_FILE" ]; then
    cat "$SOURCE_FILE"
  elif [ -n "$SOURCE_TEXT" ]; then
    printf '%s\n' "$SOURCE_TEXT"
  else
    printf '%s\n' "No text source imported. Use attachments and references for context."
  fi
  printf '~~~\n'
  printf '\n## Source Notes\n'
  printf '%s\n' "- Keep this file as the normalized text source of truth for decomposition."
} >> "$SOURCE_MD"

if [ -n "$PROMPT_FILE" ]; then
  PROMPT_REFERENCE="$PROMPT_FILE"
  HAS_PROMPT=1
fi

if [ -n "$PROMPT_TEXT" ]; then
  PROMPT_REFERENCE="inline-text"
  HAS_PROMPT=1
fi

render_metadata_template "$PROMPT_TEMPLATE" "$PROMPT_MD" "prompt" "$IMPORT_TIME" "$PROMPT_REFERENCE"
{
  printf '\n~~~text\n'
  if [ -n "$PROMPT_FILE" ]; then
    cat "$PROMPT_FILE"
  elif [ -n "$PROMPT_TEXT" ]; then
    printf '%s\n' "$PROMPT_TEXT"
  else
    printf '%s\n' "No explicit operator prompt was imported."
  fi
  printf '~~~\n'
  printf '\n## Prompt Notes\n'
  if [ "$HAS_PROMPT" -eq 1 ]; then
    printf '%s\n' "- Preserve the emphasis and exclusions in this prompt during decomposition."
  else
    printf '%s\n' "- Decomposition will proceed without an explicit operator prompt unless this file is later updated."
  fi
} >> "$PROMPT_MD"

if [ "$HAS_PROMPT" -eq 1 ]; then
  if [ -n "$PROMPT_FILE" ]; then
    PROMPT_HASH=$(cksum < "$PROMPT_FILE" | awk '{print $1}')
  else
    PROMPT_HASH=$(printf '%s' "$PROMPT_TEXT" | cksum | awk '{print $1}')
  fi
fi

while IFS= read -r asset_path; do
  [ -n "$asset_path" ] || continue
  copied_asset=$(copy_asset_unique "$asset_path")
  printf '%s\n' "openspec/changes/$CHANGE_SLUG/context/assets/$copied_asset" >> "$ATTACHMENTS_LIST"
done < "$ASSET_PATHS"

if [ -f "$MEMORY_FILE" ]; then
  load_memory_context "$MEMORY_FILE"
else
  MEMORY_CHANGE_ID="$CHANGE_INPUT"
  MEMORY_CHANGE_SLUG="$CHANGE_SLUG"
  MEMORY_CAPABILITY=""
  MEMORY_MODE="feature"
fi

tmp_refs=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-import-refs.XXXXXX")
trap 'rm -f "$ASSET_PATHS" "$ATTACHMENTS_LIST" "$tmp_refs"' EXIT INT TERM

{
  printf '{\n'
  printf '  "changeId": "%s",\n' "$(json_escape "$CHANGE_INPUT")"
  printf '  "changeSlug": "%s",\n' "$(json_escape "$CHANGE_SLUG")"
  printf '  "sourceType": "%s",\n' "$(json_escape "$SOURCE_TYPE")"
  printf '  "sourceReference": "%s",\n' "$(json_escape "$SOURCE_REFERENCE")"
  printf '  "promptReference": "%s",\n' "$(json_escape "$PROMPT_REFERENCE")"
  printf '  "sources": [\n'
  printf '    "%s"\n' "$(json_escape "$SOURCE_TYPE:$SOURCE_REFERENCE")"
  printf '  ],\n'
  printf '  "attachments": [\n'
  if [ -s "$ATTACHMENTS_LIST" ]; then
    first=1
    while IFS= read -r attachment; do
      [ -n "$attachment" ] || continue
      if [ "$first" -eq 1 ]; then
        first=0
      else
        printf ',\n'
      fi
      printf '    "%s"' "$(json_escape "$attachment")"
    done < "$ATTACHMENTS_LIST"
    printf '\n'
  fi
  printf '  ],\n'
  printf '  "promptHash": "%s",\n' "$(json_escape "$PROMPT_HASH")"
  printf '  "importedAt": "%s",\n' "$(json_escape "$IMPORT_TIME")"
  printf '  "analysisStatus": "pending",\n'
  printf '  "openQuestions": []\n'
  printf '}\n'
} > "$tmp_refs"
mv "$tmp_refs" "$REFERENCES_JSON"

write_memory_state \
  "$MEMORY_FILE" \
  "imported" \
  "import" \
  0 \
  0 \
  0 \
  ""

echo "Imported intake context for change: $CHANGE_INPUT"
echo "Created or updated:"
echo "  - openspec/changes/$CHANGE_SLUG/context/source.md"
echo "  - openspec/changes/$CHANGE_SLUG/context/prompt.md"
echo "  - openspec/changes/$CHANGE_SLUG/context/references.json"
echo "  - .oh-my-engine/memory/specs/$CHANGE_SLUG.json"
if [ -s "$ATTACHMENTS_LIST" ]; then
  echo "Attachments copied:"
  sed 's/^/  - /' "$ATTACHMENTS_LIST"
fi
echo "Next:"
echo "  1. Review context/source.md and context/prompt.md"
echo "  2. Run ./scripts/decompose-change.sh $CHANGE_INPUT"
