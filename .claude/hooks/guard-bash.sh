#!/usr/bin/env bash
# PreToolUse (Bash): block destructive or secret-leaking shell commands.
# Exit 2 blocks the call and shows stderr to Claude.
#
# This is a guardrail against likely mistakes, not a sandbox: a shell blocklist
# cannot enumerate every way to read a file. It fails closed when it cannot
# parse its input, and matches on a normalised command (backslashes removed)
# so `\cat` or `.e\nv` do not slip past.
set -uo pipefail
source "$(dirname "$0")/_json.sh"

input=$(cat)
cmd=$(json_field "$input" "tool_input.command")

deny() {
  echo "Blocked: $1" >&2
  exit 2
}

if hook_input_error "$cmd"; then
  deny "guard-bash could not parse the hook payload (node missing or invalid JSON). Refusing to run the command."
fi
[ -z "$cmd" ] && exit 0

norm=$(printf '%s' "$cmd" | tr -d '\\')

matches() {
  printf '%s' "$norm" | grep -Eq "$1"
}

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Characters that end one shell command and start the next. Patterns use
# [^;&|]* instead of .* so a match never spans two commands on one line.
same_cmd='[^;&|]*'
cmd_start='(^|[;&|(][[:space:]]*)(sudo[[:space:]]+|command[[:space:]]+|exec[[:space:]]+|env[[:space:]]+|time[[:space:]]+|nice[[:space:]]+)*'

# --- Secret env files -------------------------------------------------------
# Any path token that names an env file other than .env.example, whatever the
# verb (cat, sort, dd, redirection, variable assignment, glob, ...).
env_tokens=$(printf '%s' "$norm" \
  | grep -oE '(^|[^A-Za-z0-9_.-])\.e(nv|n\?|\*|\?v)[A-Za-z0-9_.*?-]*' \
  | sed -E 's/^[^.]*//')
for token in $env_tokens; do
  case "$token" in
    .env.example) ;;
    *)
      deny "'$token' names a secret env file. Read .env.example for variable names, and use the Write/Edit tools (not shell heredocs) for docs that mention env files."
      ;;
  esac
done

# --- Remote Supabase operations (the user's manual, reviewed steps) ----------
if matches 'supabase[[:space:]]+db[[:space:]]+push'; then
  deny "'supabase db push' applies migrations to the linked remote project. The user runs this manually after review."
fi
if matches "supabase[[:space:]]+db[[:space:]]+reset${same_cmd}--(linked|db-url)"; then
  deny "resetting a remote database is destructive. Only 'npx supabase db reset' against the local stack is allowed."
fi
if matches 'supabase[[:space:]]+(link|unlink|projects[[:space:]]+delete)'; then
  deny "linking/unlinking or deleting Supabase projects is a user decision."
fi

# --- Git history -------------------------------------------------------------
if matches "git[[:space:]]+push${same_cmd}([[:space:]]-[a-zA-Z]*f[a-zA-Z]*([[:space:]]|$)|--force|[[:space:]]\+[^[:space:]])"; then
  deny "force-pushing (including --force-with-lease and +refspec) rewrites shared history. Push normally or ask the user."
fi

# --- Migrations --------------------------------------------------------------
if matches "${cmd_start}(rm|unlink|shred|truncate|git[[:space:]]+rm)[[:space:]]${same_cmd}migrations"; then
  deny "deleting migrations breaks every environment that already applied them."
fi
if matches "find[[:space:]]${same_cmd}migrations${same_cmd}(-delete|-exec[[:space:]]+(rm|unlink|shred))"; then
  deny "deleting migrations breaks every environment that already applied them."
fi

# Writing into a migration that is already on main (redirection, tee, in-place
# edits, copies). New migration files are fine.
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
if matches "(>|>>|tee[[:space:]]|sed[[:space:]]+-[a-zA-Z]*i|perl[[:space:]]+-[a-zA-Z]*i|truncate[[:space:]]|mv[[:space:]]|cp[[:space:]])${same_cmd}migrations/[0-9]{14}_[A-Za-z0-9_-]+\.sql"; then
  for token in $(printf '%s' "$norm" | grep -oE '[A-Za-z0-9_./-]*migrations/[0-9]{14}_[A-Za-z0-9_-]+\.sql'); do
    rel="supabase/migrations/${token##*/}"
    if migration_is_published "$rel"; then
      deny "'$rel' is already on main and may be applied to a database. Create a new migration instead: npm run db:migration -- <description>"
    fi
  done
fi

# --- Lockfile ----------------------------------------------------------------
if matches "(>|>>|tee[[:space:]]|sed[[:space:]]+-[a-zA-Z]*i|perl[[:space:]]+-[a-zA-Z]*i|truncate[[:space:]]|mv[[:space:]]|cp[[:space:]])${same_cmd}package-lock\.json"; then
  deny "never hand-edit package-lock.json. Use npm install / npm uninstall."
fi

exit 0
