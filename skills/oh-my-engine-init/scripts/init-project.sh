#!/bin/sh

set -eu

FORCE=0
TEMPLATE="default"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --template)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --template" >&2
        exit 1
      fi
      TEMPLATE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
RULE_TEMPLATE_DIR="$ROOT_DIR/skills/oh-my-engine/rules"
PROJECT_TEMPLATE="$ROOT_DIR/skills/oh-my-engine-spec/templates/project.md"

PROJECT_ROOT=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_ROOT")

ensure_dir() {
  mkdir -p "$1"
}

write_file_if_needed() {
  target="$1"
  content="$2"

  if [ "$FORCE" -eq 1 ] || [ ! -f "$target" ]; then
    printf '%s\n' "$content" > "$target"
    return 0
  fi

  return 1
}

copy_if_needed() {
  src="$1"
  dest="$2"

  if [ "$FORCE" -eq 1 ] || [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    return 0
  fi

  return 1
}

append_gitignore_once() {
  pattern="$1"
  gitignore="$PROJECT_ROOT/.gitignore"

  if [ ! -f "$gitignore" ]; then
    printf '%s\n' "$pattern" > "$gitignore"
    return
  fi

  if ! grep -Fqx "$pattern" "$gitignore"; then
    printf '\n%s\n' "$pattern" >> "$gitignore"
  fi
}

ensure_dir "$PROJECT_ROOT/.oh-my-engine/workflows"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/rules"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/generated-skills"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/executions"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/learnings/candidates"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/learnings/adopted"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/preferences"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/skill-candidates"
ensure_dir "$PROJECT_ROOT/.oh-my-engine/memory/specs"
ensure_dir "$PROJECT_ROOT/openspec/changes"
ensure_dir "$PROJECT_ROOT/openspec/specs"
ensure_dir "$PROJECT_ROOT/openspec/archive"

CONFIG_CONTENT=$(cat <<EOF
{
  "project": {
    "name": "$PROJECT_NAME",
    "template": "$TEMPLATE"
  },
  "version": "1.0.0",
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "rules": ["i18n", "theme", "design-tokens"]
    },
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"]
    },
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "design-tokens", "theme"]
    },
    "api-integration": {
      "enabled": true,
      "rules": ["code-style", "error-handling"]
    },
    "spec": {
      "enabled": true,
      "format": "openspec-compatible",
      "options": {
        "specRoot": "openspec",
        "changesDir": "openspec/changes",
        "specsDir": "openspec/specs",
        "archiveDir": "openspec/archive",
        "memoryDir": ".oh-my-engine/memory/specs",
        "defaultFlow": "import-decompose-plan-apply-verify-archive",
        "manualFlow": "propose-plan-apply-verify-archive",
        "contextDirName": "context",
        "assetsDirName": "assets",
        "verifyCommands": []
      }
    }
  },
  "memory": {
    "enabled": true,
    "captureMode": "selective",
    "allowSources": {
      "workflow_command": true,
      "explicit_remember": true,
      "post_run_promotion": true
    },
    "thresholds": {
      "preferencePromotion": 0.8,
      "knowledgePromotion": 0.85,
      "skillCandidatePromotion": 0.9
    },
    "retention": "90d",
    "maxExecutions": 1000
  },
  "evolution": {
    "enabled": true,
    "autoApply": false,
    "requireVerification": true,
    "candidateOnly": true,
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3,
      "adoptedPreferenceMinEvidence": 2
    },
    "evaluationInterval": "daily",
    "optimizationThreshold": 85
  }
}
EOF
)

CONFIG_CREATED=0
if write_file_if_needed "$PROJECT_ROOT/.oh-my-engine/config.json" "$CONFIG_CONTENT"; then
  CONFIG_CREATED=1
fi

PROJECT_MD_CREATED=0
if copy_if_needed "$PROJECT_TEMPLATE" "$PROJECT_ROOT/openspec/project.md"; then
  PROJECT_MD_CREATED=1
fi

RULES_CREATED=0
for rule in i18n theme design-tokens code-style; do
  src="$RULE_TEMPLATE_DIR/$rule-template.md"
  dest="$PROJECT_ROOT/.oh-my-engine/rules/$rule.md"
  if copy_if_needed "$src" "$dest"; then
    RULES_CREATED=$((RULES_CREATED + 1))
  fi
done

append_gitignore_once ".oh-my-engine/memory/"

echo "Initialized Oh My Engine project in $PROJECT_ROOT"
echo "Template: $TEMPLATE"
echo "Config: $( [ "$CONFIG_CREATED" -eq 1 ] && echo created || echo preserved )"
echo "openspec/project.md: $( [ "$PROJECT_MD_CREATED" -eq 1 ] && echo created || echo preserved )"
echo "Rule files updated: $RULES_CREATED"
echo "Created directories:"
echo "  - .oh-my-engine/"
echo "  - openspec/"

# 自动同步 rules 到所有平台
if [ "$RULES_CREATED" -gt 0 ] && [ -f "$PROJECT_ROOT/.oh-my-engine/rules-sync.js" ]; then
  echo ""
  echo "Syncing rules to all platforms..."
  if command -v node >/dev/null 2>&1; then
    (cd "$PROJECT_ROOT" && node .oh-my-engine/rules-sync.js) || echo "Warning: rules sync failed"
  else
    echo "Warning: Node.js not found, skipping rules sync"
    echo "Run 'node .oh-my-engine/rules-sync.js' manually to sync rules"
  fi
fi
