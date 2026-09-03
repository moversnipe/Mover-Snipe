#!/usr/bin/env bash
# Stop: when TypeScript files changed, the whole project must still type-check
# before Claude may finish its turn. Exit 2 blocks stopping and shows stderr.
set -uo pipefail
source "$(dirname "$0")/_json.sh"

input=$(cat)
# Prevent an infinite loop: if this hook already forced a continuation, allow stop.
[ "$(json_field "$input" "stop_hook_active")" = "true" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0
[ -d node_modules ] || exit 0

changed=$( { git diff --name-only HEAD -- '*.ts' '*.tsx'; git ls-files --others --exclude-standard -- '*.ts' '*.tsx'; } 2>/dev/null )
[ -z "$changed" ] && exit 0

if ! output=$(npx tsc --noEmit 2>&1); then
  echo "Type-check failed. Fix these errors before finishing:" >&2
  echo "$output" | head -60 >&2
  exit 2
fi

exit 0
