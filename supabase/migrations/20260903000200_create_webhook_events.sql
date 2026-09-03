-- Webhook idempotency ledger, provider-agnostic.
-- One row per (provider, event_id). A delivery is processed only when it can
-- claim the row; replays and concurrent duplicates are skipped, failed
-- attempts can be retried, and a claim abandoned by a crashed worker becomes
-- claimable again after five minutes.
-- Written only by the service-role client through src/lib/api/webhook-event-store.ts.

create type public.webhook_event_status as enum ('processing', 'processed', 'failed');

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  status public.webhook_event_status not null default 'processing',
  attempts integer not null default 1,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (provider, event_id)
);

comment on table public.webhook_events is
  'Idempotency ledger for inbound webhooks (Stripe and any future provider). Service role only; no client access.';

create index webhook_events_status_updated_at_idx
  on public.webhook_events (status, updated_at);

alter table public.webhook_events enable row level security;
-- Intentionally no policies: only the service-role client may read or write.

create trigger webhook_events_set_updated_at
  before update on public.webhook_events
  for each row
  execute function public.set_updated_at();

-- Atomically claims an event for processing. Returns true when the caller
-- owns the event (new, previously failed, or stale in-progress claim) and
-- false when it is already processed or being processed by another worker.
create or replace function public.claim_webhook_event(
  p_provider text,
  p_event_id text,
  p_event_type text
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  claimed boolean;
begin
  insert into public.webhook_events (provider, event_id, event_type, status)
  values (p_provider, p_event_id, p_event_type, 'processing')
  on conflict (provider, event_id) do update
    set status = 'processing',
        attempts = public.webhook_events.attempts + 1,
        error = null,
        updated_at = now()
    where public.webhook_events.status = 'failed'
       or (
         public.webhook_events.status = 'processing'
         and public.webhook_events.updated_at < now() - interval '5 minutes'
       )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

comment on function public.claim_webhook_event(text, text, text) is
  'Claims a webhook event for exactly-once processing. Service role only.';

-- Only the service role may call it; it must never be reachable from clients.
revoke execute on function public.claim_webhook_event(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_webhook_event(text, text, text) to service_role;
