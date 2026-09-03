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
- A migration is immutable once it is on `main` or has been applied to any database: never edit it, write a new one. The `protect-files.sh` hook blocks edits to migrations present on `origin/main` (falling back to `HEAD` when that ref is unavailable). Migrations that exist only on your unmerged branch may still be amended.
- Every new table: `comment on table`, `enable row level security`, one policy per operation and audience with explicit `to` roles, `(select auth.uid())`, indexes on policy and foreign-key columns, and an `updated_at` trigger using `public.set_updated_at()` on tables whose rows change (an insert-only mapping table such as `customers` may omit it; say so in a comment). Several permissive `select` policies are allowed when they grant different audiences, since Postgres combines them with OR; comment the intent.
- Policy names follow one sentence shape, `"<Audience> can <verb> <object>"`, sentence case, no trailing period, at most 63 characters (Postgres truncates longer identifiers). Audience is `Users` for `to authenticated` policies scoped by `auth.uid()`, `Anyone` for `to anon, authenticated`, or a role noun such as `Team members` or `Admins` for membership checks. Verb is fixed by operation: select → `view`, insert → `create`, update → `update`, delete → `delete`. Object names the table plus its scope: `their own profile`, `active products`, `prices on their own subscriptions`. `supabase/migrations.test.ts` enforces this on every migration.
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
- `public.webhook_events` is written only through `src/lib/api/webhook-event-store.ts`; `public.claim_webhook_event` is executable by `service_role` only.
- Realtime: prefer private `broadcast` channels; do not add `postgres_changes` listeners.
