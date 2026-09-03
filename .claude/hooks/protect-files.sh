#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit): block edits to files agents must not touch.
# Exit 2 blocks the call and shows stderr to Claude.
set -uo pipefail
source "$(dirname "$0")/_json.sh"

input=$(cat)
file=$(json_field "$input" "tool_input.file_path")
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rel="${file#"$root"/}"

# A migration is immutable once it is on main (or applied anywhere). Compare
# against origin/main when that ref exists, otherwise fall back to HEAD.
migration_is_published() {
  local ref
  for ref in origin/main origin/HEAD HEAD; do
    if git -C "$root" rev-parse --verify --quiet "$ref" >/dev/null 2>&1; then
      git -C "$root" cat-file -e "$ref:$1" 2>/dev/null
      return $?
    fi
  done
  return 1
}

case "$rel" in
  .env.example)
    exit 0
    ;;
  .env|.env.*)
    echo "Blocked: '$rel' holds secrets. Document the variable in .env.example and ask the user to set it." >&2
    exit 2
    ;;
  package-lock.json)
    echo "Blocked: never hand-edit package-lock.json. Use npm install / npm uninstall." >&2
    exit 2
    ;;
  supabase/migrations/*.sql)
    if migration_is_published "$rel"; then
      echo "Blocked: '$rel' is already on main and may be applied to a database. Create a new migration instead: npm run db:migration -- <description>" >&2
      exit 2
    fi
    ;;
esac

exit 0
