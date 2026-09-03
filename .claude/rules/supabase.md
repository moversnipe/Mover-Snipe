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
- Every new table: `comment on table`, `enable row level security`, **explicit `grant`s for the Data API roles**, one policy per operation and audience with explicit `to` roles, `(select auth.uid())`, indexes on policy and foreign-key columns, and an `updated_at` trigger using `public.set_updated_at()` on tables whose rows change (an insert-only mapping table such as `customers` may omit it; say so in a comment). Several permissive `select` policies are allowed when they grant different audiences, since Postgres combines them with OR; comment the intent.
- Grants are not optional and are not implied by a policy. RLS filters rows; Postgres checks the table `grant` first, so a table with policies and no grant answers every Data API request with `42501 permission denied for table <name>` — an error, not an empty result, so the page 500s. Grant exactly what the policies allow (`select` for a read-only table, plus `update` where an update policy exists), `revoke all ... from anon, authenticated` for a private table, and `select, insert, update, delete` to `service_role`, which bypasses RLS but still needs the privilege. Never rely on Supabase's default privileges: they are absent when `auto_expose_new_tables = false`. `supabase/migrations.test.ts` fails if a created table is named by no `grant`/`revoke`.
- Policy names follow one sentence shape, `"<Audience> can <verb> <object>"`, sentence case, no trailing period, at most 63 characters (Postgres truncates longer identifiers). Audience is `Users` for `to authenticated` policies scoped by `auth.uid()`, `Anyone` for `to anon, authenticated`, or a role noun such as `Team members` or `Admins` for membership checks. Verb is fixed by operation: select → `view`, insert → `create`, update → `update`, delete → `delete`. Object names the table plus its scope: `their own profile`, `active products`, `prices on their own subscriptions`. `supabase/migrations.test.ts` enforces this on every migration.
- IDs: `uuid` referencing `auth.users` for per-user rows; Stripe ids stay `text` primary keys; otherwise `bigint generated always as identity`.
- Lowercase SQL, `public.` schema prefix, snake_case, plural tables, singular columns, `{table_singular}_id` foreign keys, `timestamptz` for time.
- Functions: `security invoker` unless the function must act for the system (then `security definer` with a comment), always `set search_path = ''`.
- After writing a migration: `npm run db:reset` (local stack) then `npm run db:types`, and commit the regenerated `database.types.ts` with the migration.
- Applying migrations to a hosted project is the user's manual step; agents never run it.

## Keys, signing keys, and identity

- API keys: the browser gets the **publishable key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_publishable_...`), the server the **secret key** (`SUPABASE_SECRET_KEY`, `sb_secret_...`). The legacy `anon`/`service_role` JWTs are accepted by the env schema for the local CLI stack only; never introduce new code paths that depend on them, and never send a publishable or secret key on `Authorization: Bearer`.
- JWTs are signed with **asymmetric signing keys** (ES256). Locally `config.toml` points `signing_keys_path` at the gitignored `supabase/signing_keys.json` (`npm run db:signing-key`). Hosted projects migrate on the dashboard JWT keys page: migrate the JWT secret, then rotate to the standby key, then revoke the legacy secret after the access-token lifetime.
- Identity is always `supabase.auth.getClaims()`: it verifies the signature locally against the JWKS. `getSession()` is never used for identity (unverified cookies). `supabase.auth.getUser()` is reserved for when the fresh user record itself is needed.
- `src/features/auth/queries.ts` (`getUser`, `requireUser`, `getUserOrThrow`) and `src/lib/supabase/session.ts` are the only places that call the auth API for identity.

## Clients (`src/lib/supabase/`)

- Server Components/Actions/Handlers: `await createClient()` from `server.ts`.
- Client Components: `createClient()` from `client.ts`.
- Admin: `createAdminClient()` from `admin.ts` only for rows that intentionally have no client policy, and only in server code that is not reachable with user-controlled ids.
- Always select explicit columns; never `select("*")`.
- Treat Supabase `error` as fatal in queries (throw) and as a failed `ActionResult` in actions.
- `public.webhook_events` is written only through `src/lib/api/webhook-event-store.ts`; `public.claim_webhook_event` is executable by `service_role` only.
- Realtime: prefer private `broadcast` channels; do not add `postgres_changes` listeners.
