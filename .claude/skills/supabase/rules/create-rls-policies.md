---
description: Guidelines for writing Postgres Row Level Security policies
---

# Database: Create RLS policies

Apply these rules whenever you create a table or write `create policy` /
`alter policy` statements. Every table in `public` has RLS enabled; a table
with RLS enabled and no policies is fully locked to clients (only the
service-role client can reach it), which is the correct default for private
data such as `public.customers`.

## Rules

- Enable RLS immediately after `create table`: `alter table public.x enable row level security;`
- One policy per operation. Never use `for all`.
- Always name the role(s): `to authenticated`, `to anon`, or `to anon, authenticated` when the predicate is identical.
- Use `(select auth.uid())`, never bare `auth.uid()`. The sub-select lets Postgres evaluate it once per query instead of once per row.
- `select` and `delete` policies take `using` only.
- `insert` policies take `with check` only.
- `update` policies take both `using` (which rows may be targeted) and `with check` (what the row may become).
- Prefer permissive policies. Use `as restrictive` only to add a hard ceiling on top of permissive ones, and comment why.
- Add an index on every column a policy filters by (`user_id`, `organization_id`, ...).
- Keep policies simple. Move complex membership checks into a `security definer` function with `set search_path = ''` and call it from the policy.
- Lowercase SQL. Policy names are short sentences in double quotes.
- Explain the intent in an SQL comment above the policy.

## Roles

- `anon`: request without a session.
- `authenticated`: request with a valid JWT. `(select auth.uid())` returns the user id.
- `service_role`: bypasses RLS. Only the admin client (`src/lib/supabase/admin.ts`) uses it, and only in trusted server code.

## Patterns

Owner-only read and write:

```sql
alter table public.notes enable row level security;

create index notes_user_id_idx on public.notes (user_id);

-- Users see only their own notes.
create policy "Users can view their own notes"
  on public.notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users may only insert notes owned by themselves.
create policy "Users can create their own notes"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users may edit their own notes and may not reassign ownership.
create policy "Users can update their own notes"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

Public read-only catalogue (see `public.products` in this repo):

```sql
-- Anyone, signed in or not, can read active catalogue rows.
create policy "Anyone can view active products"
  on public.products
  for select
  to anon, authenticated
  using (active = true);
```

Private table with no client access (see `public.customers`):

```sql
alter table public.customers enable row level security;
-- Intentionally no policies: only the service-role client may read or write.
```

Membership check through a helper function:

```sql
create or replace function public.is_team_member(team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members
    where team_members.team_id = is_team_member.team_id
      and team_members.user_id = (select auth.uid())
  );
$$;

create policy "Team members can view team documents"
  on public.documents
  for select
  to authenticated
  using ((select public.is_team_member(team_id)));
```

## Anti-patterns

- `for all` policies.
- Policies without `to`.
- `auth.uid()` without the `(select ...)` wrapper.
- `using (true)` on `insert` (invalid) or `with check` on `select`/`delete` (invalid).
- Uppercase keywords or mixed casing.
- Relying on application code instead of RLS to hide rows.
