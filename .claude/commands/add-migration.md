---
description: Create a new Supabase migration with RLS, regenerate types, and update docs
argument-hint: <short_description> <what the table/change is for>
---

Create a database migration for: $ARGUMENTS

Follow `.claude/rules/supabase.md` and the `supabase` skill exactly.

1. Generate the file name with a UTC timestamp: `supabase/migrations/$(date -u +%Y%m%d%H%M%S)_<short_description>.sql`. Never modify an existing migration.
2. Write the SQL: header comment, `create table public.<plural>`, `comment on table`, `enable row level security`, one policy per operation with `to` roles and `(select auth.uid())`, policy names shaped `"<Audience> can <verb> <object>"` (see `.claude/rules/supabase.md`), indexes on policy and FK columns, `updated_at` trigger via `public.set_updated_at()`.
3. If the local stack is running (`npx supabase status`), run `npm run db:reset` then `npm run db:types`. Otherwise update `src/lib/supabase/database.types.ts` by hand to mirror the migration exactly and say so in your summary.
4. Add or update a `queries.ts` in the owning feature with explicit column selects.
5. Run the `database-reviewer` agent on the result and fix every finding.
6. Run `npm run check`.
