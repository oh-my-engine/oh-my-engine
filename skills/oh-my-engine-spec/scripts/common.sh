#!/bin/sh

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g; s/--*/-/g; s/^-//; s/-$//'
}

utc_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

utc_stamp() {
  date -u +"%Y%m%dT%H%M%SZ"
}

json_escape() {
  printf '%s' "$1" | awk '
    BEGIN { ORS = "" }
    {
      gsub(/\\/, "\\\\")
      gsub(/"/, "\\\"")
      if (NR > 1) {
        printf "\\n"
      }
      printf "%s", $0
    }
  '
}

json_get_string() {
  key="$1"
  file="$2"
  sed -n "s/^[[:space:]]*\"$key\": \"\\([^\"]*\\)\".*/\\1/p" "$file" | head -n 1
}

json_get_string_array() {
  key="$1"
  file="$2"

  awk -v key="$key" '
    function emit_strings(text, rest, matched) {
      rest = text
      while (match(rest, /"([^"\\]|\\.)*"/)) {
        matched = substr(rest, RSTART + 1, RLENGTH - 2)
        gsub(/\\"/, "\"", matched)
        gsub(/\\\\/, "\\", matched)
        print matched
        rest = substr(rest, RSTART + RLENGTH)
      }
    }
    {
      line = $0

      if (in_block == 0) {
        if (line ~ "\"" key "\"[[:space:]]*:[[:space:]]*\\[") {
          in_block = 1
          sub(/^.*\[[[:space:]]*/, "", line)
          if (line ~ /\]/) {
            sub(/\][^]]*$/, "", line)
            emit_strings(line)
            exit
          }
          emit_strings(line)
        }
        next
      }

      if (line ~ /\]/) {
        sub(/\][^]]*$/, "", line)
        emit_strings(line)
        exit
      }

      emit_strings(line)
    }
  ' "$file"
}

count_open_checkboxes() {
  file="$1"
  awk '/^- \[ \]/{c++} END{print c+0}' "$file"
}

count_done_checkboxes() {
  file="$1"
  awk '/^- \[[xX]\]/{c++} END{print c+0}' "$file"
}

find_unresolved_placeholders() {
  awk '
    {
      line = $0
      trimmed = line
      gsub(/[[:space:]]+$/, "", trimmed)

      if (trimmed ~ /TBD:/ || trimmed ~ /`<[^>]+>`/ || trimmed ~ /<[^>]+>/) {
        print FILENAME ":" FNR ":" trimmed
      }
    }
  ' "$@"
}

delta_has_concrete_requirement() {
  file="$1"

  awk '
    /^The system / {
      line = $0
      gsub(/[[:space:]]+$/, "", line)
      if (line !~ /TBD:/) found = 1
    }
    END { exit found ? 0 : 1 }
  ' "$file"
}

delta_has_concrete_scenario() {
  file="$1"

  awk '
    /^- \*\*WHEN\*\*/ {
      line = $0
      gsub(/[[:space:]]+$/, "", line)
      if (line !~ /TBD:/) has_when = 1
    }
    /^- \*\*THEN\*\*/ {
      line = $0
      gsub(/[[:space:]]+$/, "", line)
      if (line !~ /TBD:/) has_then = 1
    }
    END { exit (has_when && has_then) ? 0 : 1 }
  ' "$file"
}

count_selected_change_types() {
  file="$1"

  awk '
    /^## Change Type$/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section && /^- \[[xX]\] (Add|Modify|Remove)$/ { count++ }
    END { print count + 0 }
  ' "$file"
}

delta_change_type() {
  file="$1"

  awk '
    /^## Change Type$/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section && /^- \[[xX]\] Add$/ { print "add"; exit }
    in_section && /^- \[[xX]\] Modify$/ { print "modify"; exit }
    in_section && /^- \[[xX]\] Remove$/ { print "remove"; exit }
  ' "$file"
}

ensure_workspace_exists() {
  project_root="$1"
  init_script="$2"

  if [ ! -f "$project_root/openspec/project.md" ]; then
    "$init_script"
  fi
}

ensure_change_exists() {
  change_dir="$1"
  change_input="$2"

  if [ ! -d "$change_dir" ]; then
    echo "Change does not exist: $change_input" >&2
    exit 1
  fi
}

load_memory_context() {
  memory_file="$1"

  MEMORY_CHANGE_ID=$(json_get_string "changeId" "$memory_file")
  MEMORY_CHANGE_SLUG=$(json_get_string "changeSlug" "$memory_file")
  MEMORY_CAPABILITY=$(json_get_string "capability" "$memory_file")
  MEMORY_MODE=$(json_get_string "mode" "$memory_file")
}

refresh_engine_memory_context() {
  project_root="$1"
  change_slug="$2"
  workflow_name="${3:-spec}"
  repo_root=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

  node "$repo_root/skills/oh-my-engine/scripts/build-engine-memory-context.js" \
    --project-root "$project_root" \
    --change-slug "$change_slug" \
    --capability "$MEMORY_CAPABILITY" \
    --workflow "$workflow_name" >/dev/null
}

print_engine_memory_directives() {
  context_file="$1"

  awk '
    /^## Execution Directives$/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section && NF { print }
  ' "$context_file"
}

count_engine_memory_directives() {
  context_file="$1"

  awk '
    /^## Execution Directives$/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section && /^- / { count++ }
    END { print count + 0 }
  ' "$context_file"
}

write_memory_state() {
  memory_file="$1"
  status="$2"
  phase="$3"
  open_tasks="$4"
  done_tasks="$5"
  open_acceptance="$6"
  archived_path="$7"

  updated_at=$(utc_iso)
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-memory.XXXXXX")

  cat > "$tmp_file" <<EOF
{
  "changeId": "$MEMORY_CHANGE_ID",
  "changeSlug": "$MEMORY_CHANGE_SLUG",
  "capability": "$MEMORY_CAPABILITY",
  "mode": "$MEMORY_MODE",
  "status": "$status",
  "phase": "$phase",
  "updatedAt": "$updated_at",
  "openTasks": $open_tasks,
  "completedTasks": $done_tasks,
  "openAcceptanceCriteria": $open_acceptance,
  "archivedPath": "$archived_path"
}
EOF

  mv "$tmp_file" "$memory_file"
}

record_spec_execution_memory() {
  project_root="$1"
  phase="$2"
  status="$3"
  summary="$4"
  archived_path="${5:-}"

  repo_root=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
  event_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-execution.XXXXXX")
  complexity="medium"
  files_json=""

  case "$phase" in
    plan)
      files_json=$(cat <<EOF
[
  "openspec/changes/$MEMORY_CHANGE_SLUG/proposal.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/design.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/tasks.md",
  ".oh-my-engine/memory/specs/$MEMORY_CHANGE_SLUG.json"
]
EOF
)
      ;;
    apply)
      files_json=$(cat <<EOF
[
  "openspec/changes/$MEMORY_CHANGE_SLUG/proposal.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/design.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/tasks.md",
  ".oh-my-engine/memory/specs/$MEMORY_CHANGE_SLUG.json"
]
EOF
)
      ;;
    verify)
      complexity="high"
      files_json=$(cat <<EOF
[
  "openspec/changes/$MEMORY_CHANGE_SLUG/proposal.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/design.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/tasks.md",
  "openspec/changes/$MEMORY_CHANGE_SLUG/specs/$MEMORY_CAPABILITY/spec.md",
  ".oh-my-engine/memory/specs/$MEMORY_CHANGE_SLUG.json"
]
EOF
)
      ;;
    archive)
      complexity="high"
      files_json=$(cat <<EOF
[
  "openspec/specs/$MEMORY_CAPABILITY/spec.md",
  "$archived_path",
  ".oh-my-engine/memory/specs/$MEMORY_CHANGE_SLUG.json"
]
EOF
)
      ;;
    *)
      rm -f "$event_file"
      echo "Unsupported spec execution phase: $phase" >&2
      exit 1
      ;;
  esac

  cat > "$event_file" <<EOF
{
  "source": "workflow_command",
  "workflow": "spec",
  "phase": "$phase",
  "changeId": "$(json_escape "$MEMORY_CHANGE_ID")",
  "changeSlug": "$MEMORY_CHANGE_SLUG",
  "capability": "$MEMORY_CAPABILITY",
  "complexity": "$complexity",
  "confidence": "high",
  "sensitivity": "low",
  "reusePotential": 0.8,
  "stability": 0.8,
  "novelty": 0.6,
  "status": "$status",
  "summary": "$(json_escape "$summary")",
  "filesTouched": $files_json,
  "testsRun": [],
  "errors": [],
  "metadata": {
    "mode": "$MEMORY_MODE"
  }
}
EOF

  node "$repo_root/skills/oh-my-engine/scripts/record-execution-memory.js" \
    --project-root "$project_root" \
    --event-file "$event_file" >/dev/null
  rm -f "$event_file"
}

append_archive_section() {
  target_file="$1"
  change_id="$2"
  delta_file="$3"

  marker="## Archived Change: $change_id"
  if grep -Fq "$marker" "$target_file"; then
    return 0
  fi

  {
    printf '\n%s\n\n' "$marker"
    cat "$delta_file"
  } >> "$target_file"
}

list_open_checkboxes() {
  file="$1"
  awk '/^- \[ \]/{line=$0; sub(/^- \[ \][[:space:]]*/, "", line); print line}' "$file"
}

set_first_matching_checkbox() {
  file="$1"
  query="$2"
  mark="$3"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-checkbox.XXXXXX")

  if awk -v q="$query" -v mark="$mark" '
    BEGIN { changed = 0 }
    {
      line = $0
      if (changed == 0 && index($0, q) > 0) {
        original = line
        if (sub(/^- \[[ xX]\]/, "- [" mark "]", line)) {
          if (line != original) changed = 1
        }
      }
      print line
    }
    END {
      if (changed == 0) exit 10
    }
  ' "$file" > "$tmp_file"; then
    mv "$tmp_file" "$file"
    return 0
  fi

  rm -f "$tmp_file"
  return 1
}

set_all_checkboxes() {
  file="$1"
  mark="$2"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-checkbox-all.XXXXXX")

  awk -v mark="$mark" '
    {
      line = $0
      sub(/^- \[[ xX]\]/, "- [" mark "]", line)
      print line
    }
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
}

append_note_to_tasks() {
  file="$1"
  note="$2"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-note.XXXXXX")

  awk -v note="$note" '
    {
      print
      if ($0 == "## Notes") {
        print "- " note
        added = 1
      }
    }
    END {
      if (!added) {
        print ""
        print "## Notes"
        print "- " note
      }
    }
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
}

ensure_capability_sections() {
  target_file="$1"

  if ! grep -Fq "<!-- OH-MY-ENGINE:CURRENT-DELTA:START -->" "$target_file"; then
    cat >> "$target_file" <<'EOF'

## Current Accepted Delta
<!-- OH-MY-ENGINE:CURRENT-DELTA:START -->
No accepted changes promoted yet.
<!-- OH-MY-ENGINE:CURRENT-DELTA:END -->
EOF
  fi

  if ! grep -Fq "<!-- OH-MY-ENGINE:HISTORY:START -->" "$target_file"; then
    cat >> "$target_file" <<'EOF'

## Change History
<!-- OH-MY-ENGINE:HISTORY:START -->
No archived changes yet.
<!-- OH-MY-ENGINE:HISTORY:END -->
EOF
  fi
}

extract_markdown_section() {
  file="$1"
  heading="$2"
  output_file="$3"

  awk -v heading="$heading" '
    $0 == heading { in_section = 1; next }
    in_section && /^## / { exit }
    in_section { print }
  ' "$file" > "$output_file"
}

extract_first_nonempty_section_line() {
  file="$1"
  heading="$2"
  output_file="$3"

  awk -v heading="$heading" '
    $0 == heading { in_section = 1; next }
    in_section && /^## / { exit }
    in_section {
      line = $0
      gsub(/^[[:space:]]+/, "", line)
      gsub(/[[:space:]]+$/, "", line)
      if (line != "") {
        print line
        found = 1
        exit
      }
    }
    END { exit found ? 0 : 1 }
  ' "$file" > "$output_file"
}

replace_markdown_section_body() {
  target_file="$1"
  heading="$2"
  content_file="$3"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-section.XXXXXX")

  awk -v heading="$heading" -v replacement="$content_file" '
    BEGIN {
      while ((getline line < replacement) > 0) {
        repl = repl line "\n"
      }
      close(replacement)
    }
    $0 == heading {
      print
      printf "%s", repl
      in_section = 1
      replaced = 1
      next
    }
    in_section && /^## / {
      in_section = 0
      print
      next
    }
    !in_section { print }
    END {
      if (!replaced) {
        if (NR > 0) print ""
        print heading
        printf "%s", repl
      }
    }
  ' "$target_file" > "$tmp_file"

  mv "$tmp_file" "$target_file"
}

remove_line_from_file() {
  target_file="$1"
  query="$2"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-remove-line.XXXXXX")

  awk -v query="$query" '
    $0 != query { print }
  ' "$target_file" > "$tmp_file"

  mv "$tmp_file" "$target_file"
}

parse_requirement_blocks() {
  delta_file="$1"
  output_dir="$2"

  mkdir -p "$output_dir"

  awk -v output_dir="$output_dir" '
    function slug(text, s) {
      s = tolower(text)
      gsub(/[^a-z0-9._-]+/, "-", s)
      gsub(/-+/, "-", s)
      gsub(/^-/, "", s)
      gsub(/-$/, "", s)
      return s
    }
    function flush_block(   title, block_file) {
      if (block == "") return
      title = current_heading
      sub(/^### /, "", title)
      block_index++
      block_file = sprintf("%s/%03d-%s.md", output_dir, block_index, slug(title))
      printf "%s", block > block_file
      close(block_file)
      block = ""
      current_heading = ""
    }
    /^## Requirements$/ { in_section = 1; next }
    in_section && /^## / { flush_block(); exit }
    in_section && /^### / {
      flush_block()
      current_heading = $0
      block = $0 "\n"
      next
    }
    in_section && current_heading != "" {
      block = block $0 "\n"
    }
    END { flush_block() }
  ' "$delta_file"
}

replace_marker_block() {
  target_file="$1"
  start_marker="$2"
  end_marker="$3"
  content_file="$4"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-marker.XXXXXX")

  awk -v start="$start_marker" -v end="$end_marker" -v replacement="$content_file" '
    BEGIN {
      while ((getline line < replacement) > 0) {
        repl = repl line "\n"
      }
      close(replacement)
      in_block = 0
    }
    index($0, start) {
      print
      printf "%s", repl
      in_block = 1
      next
    }
    index($0, end) {
      in_block = 0
      print
      next
    }
    !in_block { print }
  ' "$target_file" > "$tmp_file"

  mv "$tmp_file" "$target_file"
}

insert_before_marker() {
  target_file="$1"
  end_marker="$2"
  content_file="$3"
  tmp_file=$(mktemp "${TMPDIR:-/tmp}/oh-my-engine-spec-insert.XXXXXX")

  awk -v end="$end_marker" -v content="$content_file" '
    BEGIN {
      while ((getline line < content) > 0) {
        insertion = insertion line "\n"
      }
      close(content)
    }
    index($0, end) {
      if (insertion != "") {
        printf "%s", insertion
      }
      print
      next
    }
    { print }
  ' "$target_file" > "$tmp_file"

  mv "$tmp_file" "$target_file"
}

extract_marker_block() {
  target_file="$1"
  start_marker="$2"
  end_marker="$3"
  output_file="$4"

  awk -v start="$start_marker" -v end="$end_marker" '
    index($0, start) { in_block = 1; next }
    index($0, end) { in_block = 0; exit }
    in_block { print }
  ' "$target_file" > "$output_file"
}
