#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INIT_SCRIPT="$SCRIPT_DIR/../../oh-my-engine-init/scripts/init-project.sh"

exec "$INIT_SCRIPT" "$@"
