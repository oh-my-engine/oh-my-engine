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

json_get_string() {
  key="$1"
  file="$2"
  sed -n "s/^[[:space:]]*\"$key\": \"\\([^\"]*\\)\".*/\\1/p" "$file" | head -n 1
}

json_get_string_array() {
  key="$1"
  file="$2"

  awk -v key="$key" '
    $0 ~ "\"" key "\"[[:space:]]*:[[:space:]]*\\[" { in_block = 1; next }
    in_block && /\]/ { exit }
    in_block {
      line = $0
      gsub(/^[[:space:]]+/, "", line)
      gsub(/[[:space:]]+$/, "", line)
      sub(/,$/, "", line)
      sub(/^"/, "", line)
      sub(/"$/, "", line)
      if (length(line) > 0) print line
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
