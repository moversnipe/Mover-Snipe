---
description: Run the conventions, database, and security reviewers on the current changes and fix findings
---

Review the current uncommitted changes (`git diff HEAD` plus untracked files).

1. Run the `code-reviewer` agent.
2. If any file under `supabase/` or `src/lib/supabase/` changed, run the `database-reviewer` agent.
3. If any file under `src/features/`, `src/app/api/`, `src/lib/env/`, or `src/proxy.ts` changed, run the `security-reviewer` agent.
4. Fix every finding, re-run the relevant agent until it reports none, then run `npm run check`.
5. Report what was found and fixed, and anything left for the user to decide.
