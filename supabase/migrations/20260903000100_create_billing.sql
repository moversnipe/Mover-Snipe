-- Billing: Stripe mirror tables.
-- Written ONLY by the Stripe webhook (src/app/api/webhooks/stripe) through the
-- service-role client. Clients read products/prices (public catalogue) and
-- their own subscriptions. The customers table has no client policies at all.

create type public.pricing_type as enum ('one_time', 'recurring');

create type public.pricing_plan_interval as enum ('day', 'week', 'month', 'year');

create type public.subscription_status as enum (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

-- Maps an auth user to a Stripe customer.
create table public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.customers is
  'Private mapping from auth user to Stripe customer id. Service role only; no client access.';

alter table public.customers enable row level security;
-- Intentionally no policies: only the service-role client may read or write.
-- Intentionally no updated_at: rows are written once and never modified.

-- Stripe products.
create table public.products (
  id text primary key,
  active boolean not null default true,
  name text not null,
  description text,
  image text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  'Mirror of Stripe products (id = Stripe product id). Synced by webhook.';

alter table public.products enable row level security;

create index products_active_idx on public.products (active) where active;

create policy "Anyone can view active products"
  on public.products
  for select
  to anon, authenticated
  using (active = true);

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- Stripe prices.
create table public.prices (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  active boolean not null default true,
  description text,
  unit_amount bigint,
  currency text not null check (char_length(currency) = 3),
  type public.pricing_type not null,
  interval public.pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.prices is
  'Mirror of Stripe prices (id = Stripe price id). Synced by webhook.';

create index prices_product_id_idx on public.prices (product_id);

alter table public.prices enable row level security;

create index prices_active_idx on public.prices (active) where active;

create policy "Anyone can view active prices"
  on public.prices
  for select
  to anon, authenticated
  using (active = true);

create trigger prices_set_updated_at
  before update on public.prices
  for each row
  execute function public.set_updated_at();

-- Stripe subscriptions.
create table public.subscriptions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.subscription_status not null,
  -- set null: a price archived/deleted in Stripe must not block the sync.
  price_id text references public.prices (id) on delete set null,
  quantity integer,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Mirror of Stripe subscriptions (id = Stripe subscription id). Synced by webhook.';

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create index subscriptions_price_id_idx on public.subscriptions (price_id);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- Subscribers keep read access to the price and product they are on, even
-- after Stripe archives them (active = false). Permissive policies combine
-- with the "active" policies above by OR.
create policy "Users can view prices on their own subscriptions"
  on public.prices
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.subscriptions
      where subscriptions.price_id = prices.id
        and subscriptions.user_id = (select auth.uid())
    )
  );

create policy "Users can view products on their own subscriptions"
  on public.products
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.prices
      join public.subscriptions on subscriptions.price_id = prices.id
      where prices.product_id = products.id
        and subscriptions.user_id = (select auth.uid())
    )
  );
