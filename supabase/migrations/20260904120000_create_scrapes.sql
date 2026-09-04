-- Scraping: Bright Data Web Scraper API runs and their results.
-- A scrape is one asynchronous Bright Data collection ("snapshot"). The row is
-- created under RLS by the user who starts it (src/features/scraping/scrapes.ts)
-- and completed by the Bright Data webhook
-- (src/app/api/webhooks/brightdata -> src/features/scraping/webhook-handlers.ts)
-- through the service-role client, which is the only writer of status,
-- record_count, error, completed_at and of scrape_records.

create type public.scrape_status as enum ('running', 'ready', 'failed');

create table public.scrapes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dataset_id text not null,
  snapshot_id text not null unique,
  status public.scrape_status not null default 'running',
  input jsonb not null,
  record_count integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.scrapes is
  'One Bright Data Web Scraper API collection per row. Created by the user who starts it; status and results are written by the Bright Data webhook.';
comment on column public.scrapes.id is
  'Scrape id used by this app.';
comment on column public.scrapes.user_id is
  'The auth.users id of the user who started the scrape.';
comment on column public.scrapes.dataset_id is
  'Bright Data dataset id (gd_...) the collection ran against.';
comment on column public.scrapes.snapshot_id is
  'Bright Data snapshot id (s_...) returned when the collection was triggered. Unique; the webhook resolves the scrape by it.';
comment on column public.scrapes.status is
  'running until Bright Data notifies completion; then ready (records stored in scrape_records) or failed.';
comment on column public.scrapes.input is
  'The inputs sent to Bright Data, verbatim, as a JSON array of objects.';
comment on column public.scrapes.record_count is
  'Number of rows stored in scrape_records once the scrape is ready. Null before that.';
comment on column public.scrapes.error is
  'Error reported by Bright Data when the status is failed. Null otherwise.';
comment on column public.scrapes.created_at is
  'UTC time the collection was triggered.';
comment on column public.scrapes.completed_at is
  'UTC time the webhook marked the scrape ready or failed. Null while running.';
comment on column public.scrapes.updated_at is
  'UTC time of the last change, maintained by trigger.';

alter table public.scrapes enable row level security;

create index scrapes_user_id_created_at_idx
  on public.scrapes (user_id, created_at desc);

-- Users read their own scrapes.
create policy "Users can view their own scrapes"
  on public.scrapes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users start scrapes for themselves only.
create policy "Users can create their own scrapes"
  on public.scrapes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Intentionally no update/delete policies: completion is written by the
-- webhook through the service role, and rows are kept as an audit trail.

create trigger scrapes_set_updated_at
  before update on public.scrapes
  for each row
  execute function public.set_updated_at();

-- One row per record Bright Data returned for a ready scrape.
create table public.scrape_records (
  id bigint generated always as identity primary key,
  scrape_id uuid not null references public.scrapes (id) on delete cascade,
  position integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (scrape_id, position)
);

comment on table public.scrape_records is
  'Records downloaded from a ready Bright Data snapshot, one row each, verbatim. Written only by the Bright Data webhook.';
comment on column public.scrape_records.scrape_id is
  'The scrape these records belong to.';
comment on column public.scrape_records.position is
  'Zero-based index of the record in the snapshot. Unique per scrape; the paging cursor.';
comment on column public.scrape_records.data is
  'The record as Bright Data returned it. Fields depend on the dataset; a failed input appears as a record carrying an error field when the dataset reports it.';
comment on column public.scrape_records.created_at is
  'UTC time the record was stored. Rows are never updated.';

alter table public.scrape_records enable row level security;
-- Intentionally no updated_at: rows are written once and never modified.

-- The unique constraint above already indexes (scrape_id, position), which
-- covers the policy subquery, the foreign key, and the position cursor.

-- Users read the records of scrapes they own.
create policy "Users can view records of their own scrapes"
  on public.scrape_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.scrapes
      where scrapes.id = scrape_records.scrape_id
        and scrapes.user_id = (select auth.uid())
    )
  );

-- Intentionally no insert/update/delete policies: only the webhook writes.

-- Table privileges (see 20260903120000_grant_data_api_privileges.sql).
revoke all on table public.scrapes, public.scrape_records from anon, authenticated;
grant select on table public.scrapes to authenticated;
-- Users supply only what starts a scrape; the completion columns (status,
-- record_count, error, completed_at) and the timestamps stay webhook-owned.
grant insert (user_id, dataset_id, snapshot_id, input) on table public.scrapes to authenticated;
grant select on table public.scrape_records to authenticated;
grant select, insert, update, delete on table public.scrapes, public.scrape_records to service_role;
grant usage, select on sequence public.scrape_records_id_seq to service_role;
