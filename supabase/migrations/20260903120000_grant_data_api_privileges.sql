-- Table privileges for the Data API roles.
--
-- An RLS policy decides which ROWS a role may see. It does not grant access to
-- the table itself: Postgres checks the GRANT first, so a table with policies
-- but no grant rejects every request with
-- `42501 permission denied for table <name>` before a policy is ever evaluated.
-- That is an error, not an empty result, so it surfaces as a 500 on any page
-- that reads it.
--
-- The three earlier migrations created six tables and seven policies without a
-- single grant, relying on the Supabase default privileges that hand `anon`
-- and `authenticated` full DML on new tables in `public`. Projects created
-- with `auto_expose_new_tables = false` (see supabase/config.toml) do not have
-- that default, and there every signed-in read fails.
--
-- Stated explicitly here so the schema no longer depends on that default, and
-- narrowed to exactly what each table's policies allow: reads for clients,
-- writes only for the service role the Stripe webhook runs as.

grant usage on schema public to anon, authenticated, service_role;

-- Start from nothing, so a project that DID receive the permissive default is
-- tightened to match its policies instead of keeping write grants no policy
-- backs. Defence in depth: a future policy mistake on `subscriptions` still
-- cannot let a client write to it, because the privilege is not there.
revoke all on table
  public.profiles,
  public.products,
  public.prices,
  public.subscriptions,
  public.customers,
  public.webhook_events
from anon, authenticated;

-- profiles: "Users can view their own profile", "Users can update their own profile".
grant select, update on table public.profiles to authenticated;

-- products, prices: "Anyone can view active products"/"...active prices" are
-- `to anon, authenticated`; subscribers additionally see the archived rows
-- their own subscription points at.
grant select on table public.products to anon, authenticated;
grant select on table public.prices to anon, authenticated;

-- subscriptions: "Users can view their own subscriptions". The webhook is the
-- only writer, so clients get no insert, update or delete.
grant select on table public.subscriptions to authenticated;

-- customers and webhook_events have no policies on purpose; the revoke above
-- is their whole client story and nothing is granted back.

-- The service role bypasses RLS but still needs table privileges.
grant select, insert, update, delete on table
  public.profiles,
  public.products,
  public.prices,
  public.subscriptions,
  public.customers,
  public.webhook_events
to service_role;
