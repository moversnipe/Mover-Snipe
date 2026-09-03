---
paths:
  - "supabase/**"
  - "src/lib/supabase/**"
---

# Supabase rules

Load the `supabase` skill for detailed SQL guidance; these are the repo-specific
requirements.

## Migrations (`supabase/migrations/`)

- Create with `npm run db:migration -- <short_description>` so the file gets a `YYYYMMDDHHmmss_` prefix, or name it by hand in that format (UTC).
- A committed migration is immutable: never edit it, write a new one. (A hook enforces this.)
- Every new table: `comment on table`, `enable row level security`, one policy per operation with explicit `to` roles, `(select auth.uid())`, indexes on policy columns, and an `updated_at` trigger using `public.set_updated_at()`.
- IDs: `uuid` referencing `auth.users` for per-user rows; Stripe ids stay `text` primary keys; otherwise `bigint generated always as identity`.
- Lowercase SQL, `public.` schema prefix, snake_case, plural tables, singular columns, `{table_singular}_id` foreign keys, `timestamptz` for time.
- Functions: `security invoker` unless the function must act for the system (then `security definer` with a comment), always `set search_path = ''`.
- After writing a migration: `npm run db:reset` (local stack) then `npm run db:types`, and commit the regenerated `database.types.ts` with the migration.
- Applying migrations to a hosted project is the user's manual step; agents never run it.

## Clients (`src/lib/supabase/`)

- Server Components/Actions/Handlers: `await createClient()` from `server.ts`.
- Client Components: `createClient()` from `client.ts`.
- Admin: `createAdminClient()` from `admin.ts` only for rows that intentionally have no client policy, and only in server code that is not reachable with user-controlled ids.
- Always select explicit columns; never `select("*")`.
- Treat Supabase `error` as fatal in queries (throw) and as a failed `ActionResult` in actions.
- Realtime: prefer private `broadcast` channels; do not add `postgres_changes` listeners.
