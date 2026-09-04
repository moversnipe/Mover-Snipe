-- Scrape jobs: one row per Bright Data Web Scraper API request made for a user.
-- Created under RLS by the user who asks for the scrape
-- (src/features/scraping/scrape.ts). Completed only by the system through the
-- service-role client (src/features/scraping/jobs.ts), from Bright Data's
-- synchronous answer or from the webhook at /api/webhooks/brightdata, so a
-- client can never rewrite a job's status or records.

create type public.scrape_job_status as enum ('running', 'ready', 'failed');

create table public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dataset_id text not null,
  input jsonb not null,
  status public.scrape_job_status not null default 'running',
  snapshot_id text unique,
  records jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.scrape_jobs is
  'One Bright Data Web Scraper API request per row. Users create and read their own; only the service role completes them.';
comment on column public.scrape_jobs.id is
  'Job id. Also carried in the webhook URL given to Bright Data, so a delivery can be matched to its job.';
comment on column public.scrape_jobs.user_id is
  'The auth.users id the scrape was run for.';
comment on column public.scrape_jobs.dataset_id is
  'Bright Data dataset id (gd_...) of the scraper that was run.';
comment on column public.scrape_jobs.input is
  'JSON array of input rows sent to Bright Data, each keyed by the dataset''s input columns (usually url).';
comment on column public.scrape_jobs.status is
  'running until Bright Data delivers; ready when records are stored; failed when Bright Data reported failure or rejected the request.';
comment on column public.scrape_jobs.snapshot_id is
  'Bright Data snapshot id when the collection outlived the synchronous window. Null when the answer came back inline or is not yet known.';
comment on column public.scrape_jobs.records is
  'JSON array of records as Bright Data delivered them, including per-input error records. Null until the job is ready.';
comment on column public.scrape_jobs.error is
  'Fixed, user-safe description of why the job failed. Null unless status is failed.';
comment on column public.scrape_jobs.created_at is
  'UTC time the job was requested.';
comment on column public.scrape_jobs.updated_at is
  'UTC time of the last update, maintained by trigger.';
comment on column public.scrape_jobs.completed_at is
  'UTC time the job became ready or failed. Null while running.';

create index scrape_jobs_user_id_created_at_idx
  on public.scrape_jobs (user_id, created_at desc);

alter table public.scrape_jobs enable row level security;

-- A user sees only the jobs run for them.
create policy "Users can view their own scrape jobs"
  on public.scrape_jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A user can start a job only for themselves; the row is born 'running'.
create policy "Users can create their own scrape jobs"
  on public.scrape_jobs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Intentionally no update or delete policies: completion is recorded by the
-- service role, and rows go away with the user through the cascade.

create trigger scrape_jobs_set_updated_at
  before update on public.scrape_jobs
  for each row
  execute function public.set_updated_at();

-- Privileges match the policies: clients create and read, the service role
-- completes (see 20260903120000_grant_data_api_privileges.sql for why).
-- The insert grant is column-level so a client cannot hand-craft a finished
-- job through the Data API: status, snapshot_id, records, error, and the
-- timestamps can only take their defaults and are later set by the system.
revoke all on table public.scrape_jobs from anon, authenticated;
grant select on table public.scrape_jobs to authenticated;
grant insert (user_id, dataset_id, input) on table public.scrape_jobs to authenticated;
grant select, insert, update, delete on table public.scrape_jobs to service_role;
