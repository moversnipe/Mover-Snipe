# Mover Snipe

Built on **Next.js 16** (App Router, React 19, TypeScript 6), **Supabase**
(Postgres with row-level security, Auth), **Stripe** (Checkout, Customer
Portal, webhook-synced subscriptions), and **shadcn/ui on Base UI** with
Tailwind CSS 4. Ships with a modular repo layout, typed environment
validation, a Server Action result contract, structured errors, tests, CI,
and a complete Claude Code setup (rules, hooks, agents, commands) so
AI-assisted changes follow the same conventions as human ones.

## What is included

**Auth**

- Complete email + password flow via Server Actions, Zod-validated: sign in (`/auth/login`), sign up (`/auth/sign-up`), confirmation notice (`/auth/sign-up-success`), password reset request (`/auth/forgot-password`), and new password (`/auth/update-password`).
- PKCE callback (`/auth/callback`) with a sanitized `next` redirect, resolved against `NEXT_PUBLIC_SITE_URL` rather than the request host, and an error page (`/auth/auth-code-error`).
- Session refresh and route protection in `src/proxy.ts` driven by `src/config/routes.ts`, using `getClaims()` to verify the JWT signature locally against the project's signing keys.
- Built for Supabase's **publishable/secret API keys** and **asymmetric JWT signing keys**; Edge Functions run with `verify_jwt = false` and authorise in code (`supabase/functions/whoami` is the template).
- `profiles` table created for every user by a database trigger.

**Billing**

- `products`, `prices`, `subscriptions`, `customers` tables mirrored from Stripe by the webhook at `/api/webhooks/stripe`.
- `webhook_events` idempotency ledger: every webhook (Stripe or a future provider) is processed at most once per event id; replays, concurrent deliveries, and retries after failure are handled by an atomic claim function.
- The checkout and portal UI — pricing table, `startCheckout`, `openBillingPortal`, and the subscription summary — lives in `src/features/billing/`, but no page mounts it yet: `/billing` and `/dashboard` are placeholders like the rest of the app. Compose those components into a page when the billing screens are designed.

**App shell**

- Collapsible shadcn/ui sidebar over every signed-in page in the `inset` style — the page wrapper takes the sidebar colour so the rail reads as background rather than a panel, and the content floats on it as one rounded card. Driven by `NAV_SECTIONS` in `src/config/navigation.ts`: Dashboard on its own, then **Pipeline** (Listings, Prospects), **Outreach** (Templates, Campaigns, Mails), and **Account** (Billing, Settings).
- The signed-in account sits at the foot of the sidebar — avatar, name, email — and its menu owns the theme choice and sign-out. Collapsed to icon width it shows the avatar alone.
- The active entry is derived from the current path, so a nested page such as `/listings/<id>` keeps Listings selected, and the header breadcrumb names the section and page.
- Open/collapsed state persists in the `sidebar_state` cookie and is read back in `(app)/layout.tsx`, so the first server render matches what the user last chose. Toggle with the header button or `Ctrl`/`Cmd` + `B`. The vendored `SidebarRail` is deliberately left out: it dresses the sidebar edge with a hover highlight and a `cursor-w-resize`, which promises a drag it does not implement — it only toggles on click.
- Geist and Geist Mono via `next/font`, applied on `<body>` alongside the classes that declare their custom properties (`font-sans` on `<html>` cannot see them, so the face silently fell back).

**Foundation**

- `src/lib/env/`: Zod-validated `clientEnv` / `serverEnv`; the app fails fast when a variable is missing.
- `src/lib/errors.ts`: stable `ErrorCode`s, `AppError`, HTTP status mapping.
- `src/lib/actions/result.ts`: one `ActionResult` shape for every Server Action.
- `src/lib/api/`: `createHandler` wrapper, request validation helpers, and one JSON envelope for every Route Handler; a structure test keeps new endpoints on the same shape.
- `src/lib/logger.ts`: structured JSON logging.
- Root `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`.
- 60+ shadcn/ui components (Base UI, `render` prop composition), dark mode via `next-themes`.
- Vitest + Testing Library, ESLint, Prettier (with Tailwind class sorting), strict TypeScript, GitHub Actions CI, Dependabot.

## Prerequisites

- Node.js 24 (CI version) and npm
- Docker (for the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (used via `npx supabase`)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) (for `npm run stripe:listen`)
- A Stripe account in test mode

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase (local)

```bash
npm run db:signing-key # once; writes the local ES256 signing key to supabase/signing_keys.json (gitignored)
npm run db:start       # starts Postgres, Auth, Studio, email testing server; prints keys
npm run db:reset       # applies supabase/migrations/
```

`supabase/config.toml` is committed and already sets the auth redirect URLs,
`signing_keys_path`, and `verify_jwt = false` for every Edge Function. Copy the
printed **API URL** and keys into the env file from step 1: the publishable key
as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the secret key as
`SUPABASE_SECRET_KEY`. If your CLI version prints only the legacy `anon` and
`service_role` JWTs, use those in the same variables; the app accepts both.

Email confirmation is **off** in the CLI's default `config.toml`
(`[auth.email] enable_confirmations = false`), so local sign-up signs the user
in immediately. To test the confirmation flow, set it to `true`; sign-up then
lands on `/auth/sign-up-success` and the emails are viewable in the local email
testing server (`[local_smtp]`, port 54324 by default). Password reset emails
show up there too. Restart the stack after editing `config.toml`
(`npm run db:stop && npm run db:start`).

### 3. Stripe (sandbox or test mode)

1. Put your test secret key in `.env.local` as `STRIPE_SECRET_KEY`.
2. In a second terminal run `npm run stripe:listen` and copy the printed `whsec_…` value into `STRIPE_WEBHOOK_SECRET`.
3. In the Stripe Dashboard (sandbox or test mode) create a product with at least one recurring price **while the listener is running**; the webhook writes it to `products`/`prices`. For products created earlier, edit and save them to emit `product.updated`.
4. Enable the Customer Portal once under Dashboard → Settings → Billing → Customer portal (required before `openBillingPortal` can create sessions, once a page mounts it).

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and create an account. To verify the Stripe half
end to end, keep `npm run stripe:listen` running and create or edit a product
with a recurring price in the Stripe Dashboard: the webhook writes it to
`products`/`prices`. There is no checkout screen to click through yet — see
the Billing note above.

## Scripts

| Script                                      | Purpose                                                        |
| ------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev` / `build` / `start`           | Next.js                                                        |
| `npm run check`                             | format check + lint + type-check + tests (the pre-commit gate) |
| `npm run format` / `format:check`           | Prettier                                                       |
| `npm run lint` / `lint:fix`                 | ESLint                                                         |
| `npm run type-check`                        | `tsc --noEmit`                                                 |
| `npm test` / `test:watch`                   | Vitest                                                         |
| `npm run db:start` / `db:stop` / `db:reset` | Local Supabase stack                                           |
| `npm run db:migration -- <name>`            | New migration file                                             |
| `npm run db:types`                          | Regenerate `src/lib/supabase/database.types.ts`                |
| `npm run db:signing-key`                    | Generate the local JWT signing key (gitignored)                |
| `npm run functions:serve`                   | Serve Edge Functions locally                                   |
| `npm run stripe:listen`                     | Forward Stripe webhooks to the dev server                      |

## Project structure

```
src/
├── app/                        Routes only (thin)
│   ├── (marketing)/page.tsx    Public landing page
│   ├── (app)/                  Signed-in area; layout enforces auth and
│   │   │                       renders the collapsible sidebar shell
│   │   ├── dashboard/page.tsx
│   │   ├── listings/ · prospects/          Pipeline
│   │   ├── templates/ · campaigns/ · mails/  Outreach
│   │   └── billing/ · settings/            Account
│   ├── auth/                   layout.tsx · login/ · sign-up/ · sign-up-success/
│   │                           forgot-password/ · update-password/
│   │                           callback/route.ts · auth-code-error/
│   ├── api/                    health/, webhooks/stripe/
│   └── layout.tsx · error.tsx · global-error.tsx · loading.tsx · not-found.tsx
├── features/                   Domain modules
│   ├── auth/                   schemas · queries · actions · redirect · account · components/
│   └── billing/                schemas · queries · actions · customers · webhook-handlers · enums · format · components/
├── components/
│   ├── ui/                     shadcn/ui (Base UI) — add via CLI
│   └── app-sidebar.tsx · app-breadcrumb.tsx · providers.tsx
│       theme-provider.tsx · theme-toggle.tsx
├── config/                     routes.ts · navigation.ts · site.ts
├── lib/
│   ├── env/                    client.ts · server.ts
│   ├── actions/result.ts       ActionResult contract
│   ├── api/                    handler · validate · response · idempotency · webhook-event-store
│   ├── supabase/               client · server · admin · session · database.types
│   ├── stripe/                 server · webhooks
│   ├── errors.ts · logger.ts · utils.ts
├── hooks/                      use-mobile.ts
├── test/                       Vitest setup
└── proxy.ts                    Session refresh + route protection
supabase/                       config.toml · migrations/ (profiles, billing, webhook_events) · functions/whoami (Edge Function template)
.claude/                        Claude Code rules, hooks, agents, commands, skills
.github/                        CI workflow, Dependabot
```

## Conventions

`CLAUDE.md` is the canonical conventions document (naming, placement, code
style, security rules) and `.claude/rules/*.md` hold path-specific rules. They
are written for AI agents but apply to everyone. Highlights:

- Routes are thin; domain code lives in `src/features/<domain>/` with fixed file names.
- Server Actions return `ActionResult`; API Route Handlers return `{ data }` or `{ error: { code, message } }`.
- Every table has RLS with one policy per operation and audience; migrations are immutable once merged or applied.
- The Stripe webhook is the only writer of the billing tables.
- `npm run check` must pass before every commit.

## Working with Claude Code

Open the repo in Claude Code and the setup in `.claude/` activates:

- **Hooks** format and lint each edited file, block edits to secrets and merged migrations, block remote Supabase pushes and force pushes, and refuse to end a turn while type-check fails. They are guardrails against likely mistakes, not a security sandbox.
- **Rules** load per path (`src/app`, `src/features`, `supabase`, …).
- **Agents**: `code-reviewer`, `database-reviewer`, `security-reviewer` (read-only).
- **Commands**: `/add-feature`, `/add-migration`, `/add-endpoint`, `/add-component`, `/review`.
- **MCP servers** (`.mcp.json`): shadcn registry, Supabase (read-only), Stripe. The hosted servers ask you to sign in on first use.

## Environment variables

All variables are required (see `.env.example`):

| Variable                               | Scope  | Purpose                                                                                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | public | Absolute origin for auth and Stripe redirect URLs                                                                             |
| `NEXT_PUBLIC_SUPABASE_URL`             | public | Supabase project URL                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Supabase publishable key `sb_publishable_...` (RLS applies; legacy anon JWT accepted for the local stack)                     |
| `SUPABASE_SECRET_KEY`                  | server | Supabase secret key `sb_secret_...` for the admin client; bypasses RLS (legacy service_role JWT accepted for the local stack) |
| `STRIPE_SECRET_KEY`                    | server | Stripe API key                                                                                                                |
| `STRIPE_WEBHOOK_SECRET`                | server | Signing secret for `/api/webhooks/stripe`                                                                                     |

## Deploying

1. Create a hosted Supabase project and apply the migrations from your machine with `npx supabase link` then `npx supabase db push` (agents are blocked from doing this).
2. In the Supabase Dashboard → Authentication → URL Configuration, set **Site URL** to your domain and add `https://<your-domain>/auth/callback` to **Redirect URLs**. The default email templates route through that callback; nothing else needs to be allow-listed.
3. Still under Authentication, harden the settings the local `config.toml` cannot set for you — each one closes a gap the app cannot close on its own:
   - **Confirm email: on.** With it off, sign-up answers differently for a registered address than for a new one, which lets anyone enumerate your users. On, both outcomes land on `/auth/sign-up-success`.
   - **Minimum password length: 8**, matching `passwordSchema` in `src/features/auth/schemas.ts`. The Auth API is public, so the Zod check alone does not bind it.
   - **Secure password change: on**, so a session that is no longer fresh cannot set a new password without reauthenticating. The recovery-link flow is unaffected: that session is new.
   - **Enable CAPTCHA** and review the email rate limits before configuring custom SMTP. `/auth/forgot-password` is public, and the default per-address throttle is one send per second.
4. Settings → API Keys → **Publishable and secret API keys**: create the keys (they are named `default`). Use them for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`; do not ship the legacy `anon`/`service_role` JWTs. Each variable takes a single key's value — Edge Functions separately receive all of them as the `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` JSON objects.
5. Settings → JWT Keys: click **Migrate JWT secret**, then **Rotate keys** to the standby ES256 key. After at least the access-token lifetime plus a margin (75 minutes at the default 1 hour), revoke the legacy secret. `getClaims()` picks up the new keys automatically through the JWKS endpoint.
6. Deploy Edge Functions with `npx supabase functions deploy`; `config.toml` already disables gateway JWT verification for each, and `withSupabase` authorises in code.
7. In Stripe (live mode) add a webhook endpoint for `https://<your-domain>/api/webhooks/stripe` subscribed to: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, `price.deleted`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Use its signing secret as `STRIPE_WEBHOOK_SECRET`.
8. Set all six environment variables on your host (Vercel or any Node.js platform that runs Next.js) and deploy.

## Learn more

- [Next.js](https://nextjs.org/docs) · [Supabase](https://supabase.com/docs) · [Stripe](https://docs.stripe.com) · [shadcn/ui](https://ui.shadcn.com) · [Base UI](https://base-ui.com/) · [Tailwind CSS](https://tailwindcss.com/docs) · [TanStack Query](https://tanstack.com/query/latest)
