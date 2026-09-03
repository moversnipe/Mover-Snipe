---
paths:
  - "src/lib/stripe/**"
  - "src/features/billing/**"
  - "src/app/api/webhooks/**"
---

# Stripe rules

- The webhook (`src/app/api/webhooks/stripe/route.ts` → `lib/stripe/webhooks.ts` for verification → `features/billing/webhook-handlers.ts`) is the **only writer** of `products`, `prices`, `subscriptions`, and `customers` (the latter also via `features/billing/customers.ts` on first checkout). Never write these tables from pages or other actions.
- Handlers re-fetch the object from Stripe when ordering matters (subscriptions) instead of trusting the event payload.
- Billing period fields (`current_period_start/end`) live on `subscription.items.data[n]`, not on the subscription, in the pinned SDK version. Do not "fix" this back.
- Stripe enum fields are typed `Known | OtherString`. Parse them with the Zod schemas in `features/billing/enums.ts` before writing to the database; unknown values must fail loudly.
- Never trust a price id from the client. `startCheckout` re-reads the price through the user's RLS-scoped client before creating a session.
- Success, cancel, and return URLs are built with `absoluteUrl()` from `src/config/site.ts`.
- The Stripe secret key and webhook secret come only from `serverEnv`. The SDK instance in `lib/stripe/server.ts` is `server-only`.
- Amounts are integer minor units (`unit_amount`); format with `formatPrice` only at render time.
- Handled event types are listed in `HANDLED_EVENT_TYPES`; add a case to `handleStripeEvent` and the set together, and add a migration if a new column is needed.
- Local testing: `npm run stripe:listen` (Stripe CLI) forwards events to the dev server and prints the `whsec_` signing secret for `.env.local`.
