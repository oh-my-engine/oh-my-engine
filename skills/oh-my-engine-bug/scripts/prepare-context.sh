#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

node "$REPO_ROOT/skills/oh-my-engine/scripts/render-workflow-guidance.js" \
  --project-root "$(pwd)" \
  --workflow "bug-analysis" \
  --input "$*"
