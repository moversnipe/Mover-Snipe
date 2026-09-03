#!/usr/bin/env bash
# SessionStart: make sure the toolchain works and surface project reminders.
# stdout is added to Claude's context.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if [ ! -d node_modules ] && command -v npm >/dev/null 2>&1; then
  if npm ci --no-audit --no-fund >/dev/null 2>&1; then
    echo "Installed dependencies (node_modules was missing)."
  else
    echo "WARNING: npm ci failed; lint/type-check/test will not run until dependencies install."
  fi
fi

if [ ! -f .env.local ]; then
  echo "Note: .env.local is missing. next build/dev and any Supabase or Stripe call will fail until the user creates it from .env.example. Never write secrets yourself."
fi

echo "Reminder: follow CLAUDE.md and .claude/rules/. Run 'npm run check' before finishing a task."
