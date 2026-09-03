#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): format the edited file and lint it.
# Exit 2 feeds the lint output back to Claude so it fixes the file now.
set -uo pipefail
source "$(dirname "$0")/_json.sh"

input=$(cat)
file=$(json_field "$input" "tool_input.file_path")
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0
[ -d node_modules ] || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.css|*.md|*.mdx|*.yml|*.yaml)
    npx prettier --write --log-level warn "$file" >/dev/null 2>&1 || true
    ;;
esac

case "$file" in
  *.ts|*.tsx|*.mjs)
    if ! output=$(npx eslint --no-warn-ignored --max-warnings=0 "$file" 2>&1); then
      echo "ESLint failed for $file. Fix these before continuing:" >&2
      echo "$output" >&2
      exit 2
    fi
    ;;
esac

exit 0
