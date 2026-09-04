-- Column documentation. Tables already carry a comment; this names what a
-- caller must interpret on each column (.claude/rules/agent-ready.md, rule 12).
-- Comments only: no schema, policy, or grant changes, so database.types.ts is
-- unaffected.

-- profiles
comment on column public.profiles.id is
  'The auth.users id this profile belongs to.';
comment on column public.profiles.email is
  'Copy of auth.users.email, kept current by trigger. Null when the auth user has no email.';
comment on column public.profiles.full_name is
  'Display name from sign-up metadata. Null when never provided.';
comment on column public.profiles.avatar_url is
  'Absolute URL of the profile image. Null when never provided.';
comment on column public.profiles.created_at is
  'UTC time the profile row was created.';
comment on column public.profiles.updated_at is
  'UTC time of the last update, maintained by trigger.';

-- customers
comment on column public.customers.id is
  'The auth.users id of the customer.';
comment on column public.customers.stripe_customer_id is
  'Stripe customer id (cus_...) created for this user on first checkout.';
comment on column public.customers.created_at is
  'UTC time the mapping was created. Rows are never updated.';

-- products
comment on column public.products.id is
  'Stripe product id (prod_...).';
comment on column public.products.active is
  'False once archived in Stripe. Only active products are offered for sale.';
comment on column public.products.name is
  'Product name as shown in Stripe and on the pricing page.';
comment on column public.products.description is
  'Marketing description from Stripe. Null when none is set.';
comment on column public.products.image is
  'Absolute URL of the first Stripe product image. Null when there is none.';
comment on column public.products.metadata is
  'Stripe metadata object, verbatim. Empty object when none is set.';
comment on column public.products.created_at is
  'UTC time the mirror row was first written.';
comment on column public.products.updated_at is
  'UTC time of the last webhook sync, maintained by trigger.';

-- prices
comment on column public.prices.id is
  'Stripe price id (price_...).';
comment on column public.prices.product_id is
  'The product this price belongs to.';
comment on column public.prices.active is
  'False once archived in Stripe. Only active prices can be checked out.';
comment on column public.prices.description is
  'Stripe price nickname. Null when none is set.';
comment on column public.prices.unit_amount is
  'Amount per unit in the minor unit of currency (cents for usd). Null for prices without a fixed amount.';
comment on column public.prices.currency is
  'Three-letter ISO 4217 code in lowercase, as Stripe sends it.';
comment on column public.prices.type is
  'one_time is charged once; recurring bills every interval.';
comment on column public.prices.interval is
  'Billing period unit for recurring prices. Null for one_time prices.';
comment on column public.prices.interval_count is
  'Number of intervals per billing period (every 3 months = month, 3). Null for one_time prices.';
comment on column public.prices.trial_period_days is
  'Free trial length in days for recurring prices. Null when there is no trial or the price is one_time.';
comment on column public.prices.metadata is
  'Stripe metadata object, verbatim. Empty object when none is set.';
comment on column public.prices.created_at is
  'UTC time the mirror row was first written.';
comment on column public.prices.updated_at is
  'UTC time of the last webhook sync, maintained by trigger.';

-- subscriptions
comment on column public.subscriptions.id is
  'Stripe subscription id (sub_...).';
comment on column public.subscriptions.user_id is
  'The auth.users id of the subscriber.';
comment on column public.subscriptions.status is
  'Stripe subscription status. trialing and active grant access; the rest do not.';
comment on column public.subscriptions.price_id is
  'The price on the first subscription item. Null if that price was deleted in Stripe.';
comment on column public.subscriptions.quantity is
  'Quantity on the first subscription item. Null when Stripe reports none.';
comment on column public.subscriptions.cancel_at_period_end is
  'True when the subscriber has chosen to end the subscription at current_period_end.';
comment on column public.subscriptions.current_period_start is
  'UTC start of the current billing period.';
comment on column public.subscriptions.current_period_end is
  'UTC end of the current billing period; the next renewal or, with cancel_at_period_end, the end of access.';
comment on column public.subscriptions.ended_at is
  'UTC time the subscription ended. Null while it is live.';
comment on column public.subscriptions.cancel_at is
  'UTC time a scheduled cancellation takes effect. Null when none is scheduled.';
comment on column public.subscriptions.canceled_at is
  'UTC time the cancellation was requested. Null when never canceled.';
comment on column public.subscriptions.trial_start is
  'UTC start of the trial. Null when there was no trial.';
comment on column public.subscriptions.trial_end is
  'UTC end of the trial. Null when there was no trial.';
comment on column public.subscriptions.metadata is
  'Stripe metadata object, verbatim. Empty object when none is set.';
comment on column public.subscriptions.created_at is
  'UTC time the subscription was created in Stripe.';
comment on column public.subscriptions.updated_at is
  'UTC time of the last webhook sync, maintained by trigger.';

-- webhook_events
comment on column public.webhook_events.provider is
  'Short provider slug the event came from, such as stripe.';
comment on column public.webhook_events.event_id is
  'The provider''s own unique event id. Never a hash of the payload.';
comment on column public.webhook_events.event_type is
  'The provider''s event type, such as customer.subscription.updated.';
comment on column public.webhook_events.status is
  'processing while a worker holds the claim, processed on success, failed when the handler threw.';
comment on column public.webhook_events.attempts is
  'Number of times the event has been claimed, including the first.';
comment on column public.webhook_events.error is
  'Message from the last failed attempt, truncated to 1000 characters. Null after success.';
comment on column public.webhook_events.received_at is
  'UTC time of the first delivery.';
comment on column public.webhook_events.processed_at is
  'UTC time the handler succeeded. Null until then.';
comment on column public.webhook_events.updated_at is
  'UTC time of the last status change, maintained by trigger. A processing claim older than five minutes is treated as abandoned.';
