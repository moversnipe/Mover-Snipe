#!/usr/bin/env bash
# PreToolUse (Bash): block destructive or secret-leaking shell commands.
# Exit 2 blocks the call and shows stderr to Claude.
set -uo pipefail
source "$(dirname "$0")/_json.sh"

input=$(cat)
cmd=$(json_field "$input" "tool_input.command")
[ -z "$cmd" ] && exit 0

deny() {
  echo "Blocked: $1" >&2
  exit 2
}

matches() {
  printf '%s' "$cmd" | grep -Eq "$1"
}

# Characters that end one shell command and start the next. Patterns use
# [^;&|]* instead of .* so a match never spans two commands on one line.
same_cmd='[^;&|]*'

# Remote Supabase operations are the user's manual, reviewed steps.
if matches 'supabase[[:space:]]+db[[:space:]]+push'; then
  deny "'supabase db push' applies migrations to the linked remote project. The user runs this manually after review."
fi
if matches "supabase[[:space:]]+db[[:space:]]+reset${same_cmd}--(linked|db-url)"; then
  deny "resetting a remote database is destructive. Only 'npx supabase db reset' against the local stack is allowed."
fi
if matches 'supabase[[:space:]]+(link|unlink|projects[[:space:]]+delete)'; then
  deny "linking/unlinking or deleting Supabase projects is a user decision."
fi

# History and migration safety.
if matches "git[[:space:]]+push${same_cmd}([[:space:]]-f([[:space:]]|$)|--force)"; then
  deny "force-pushing rewrites shared history. Push normally or ask the user."
fi
if matches "rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*[[:space:]]${same_cmd}supabase/migrations"; then
  deny "deleting migrations breaks every environment that already applied them."
fi

# Reading or copying secret env files. `.env.example` is fine, and so is the
# JavaScript expression `process.env`: the file name must start a path token,
# i.e. follow the reader's space directly or a space, slash, quote, or `=`.
readers='(cat|less|more|head|tail|bat|sed|awk|grep|rg|cut|source|xxd|od|strings|base64|cp|mv|scp|rsync|curl|python3?|node|vim?|nano|code)'
token_start='[[:space:]/="'"'"']'
secret_env='\.env(\.(local|development|production|test)|\.[a-z]+\.local)?([^A-Za-z0-9_.-]|$)'
if matches "(^|[;&|(][[:space:]]*)(sudo[[:space:]]+)?${readers}[[:space:]]+(${same_cmd}${token_start})?${secret_env}"; then
  deny "that command reads a secret .env file. Read .env.example for variable names instead."
fi

exit 0
