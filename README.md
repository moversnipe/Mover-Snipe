# Next.js + Supabase + Stripe Boilerplate

A production-shaped starter for paid web apps: **Next.js 16** (App Router,
React 19, TypeScript 6), **Supabase** (Postgres with row-level security, Auth),
**Stripe** (Checkout, Customer Portal, webhook-synced subscriptions), and
**shadcn/ui on Base UI** with Tailwind CSS 4. Ships with a modular repo layout,
typed environment validation, a Server Action result contract, structured
errors, tests, CI, and a complete Claude Code setup (rules, hooks, agents,
commands) so AI-assisted changes follow the same conventions as human ones.

## What is included

**Auth**

- Email + password sign-in and sign-up via Server Actions (`/auth/login`), Zod-validated.
- PKCE callback (`/auth/callback`) with a sanitized `next` redirect, and an error page.
- Session refresh and route protection in `src/proxy.ts` driven by `src/config/routes.ts`.
- `profiles` table created for every user by a database trigger.

**Billing**

- `products`, `prices`, `subscriptions`, `customers` tables mirrored from Stripe by the webhook at `/api/webhooks/stripe`.
- `/billing`: pricing table from the database, Stripe Checkout, Customer Portal.
- `/dashboard`: profile and current subscription.

**Foundation**

- `src/lib/env/`: Zod-validated `clientEnv` / `serverEnv`; the app fails fast when a variable is missing.
- `src/lib/errors.ts`: stable `ErrorCode`s, `AppError`, HTTP status mapping.
- `src/lib/actions/result.ts`: one `ActionResult` shape for every Server Action.
- `src/lib/api/response.ts`: one JSON envelope for every Route Handler.
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
npx supabase init      # once; creates supabase/config.toml
npm run db:start       # starts Postgres, Auth, Studio, email testing server; prints keys
npm run db:reset       # applies supabase/migrations/
```

Copy the printed **API URL**, **anon key**, and **service_role key** into
`.env.local`. Then, in `supabase/config.toml`, point auth redirects at the app:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```

Email confirmation is **off** in the CLI's default `config.toml`
(`[auth.email] enable_confirmations = false`), so local sign-up signs the user
in immediately. To test the confirmation flow, set it to `true`; the emails are
then viewable in the local email testing server (`[local_smtp]`, port 54324 by
default). Restart the stack after editing `config.toml`
(`npm run db:stop && npm run db:start`).

### 3. Stripe (sandbox or test mode)

1. Put your test secret key in `.env.local` as `STRIPE_SECRET_KEY`.
2. In a second terminal run `npm run stripe:listen` and copy the printed `whsec_…` value into `STRIPE_WEBHOOK_SECRET`.
3. In the Stripe Dashboard (sandbox or test mode) create a product with at least one recurring price **while the listener is running**; the webhook writes it to `products`/`prices`. For products created earlier, edit and save them to emit `product.updated`.
4. Enable the Customer Portal once under Dashboard → Settings → Billing → Customer portal (required before `openBillingPortal` can create sessions).

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, create an account, then visit `/billing` and
check out with Stripe's test card `4242 4242 4242 4242`.

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
| `npm run stripe:listen`                     | Forward Stripe webhooks to the dev server                      |

## Project structure

```
src/
├── app/                        Routes only (thin)
│   ├── (marketing)/page.tsx    Public landing page
│   ├── (app)/                  Signed-in area; layout enforces auth
│   │   ├── dashboard/page.tsx
│   │   └── billing/page.tsx
│   ├── auth/                   login/, callback/route.ts, auth-code-error/
│   ├── api/                    health/, webhooks/stripe/
│   └── layout.tsx · error.tsx · global-error.tsx · loading.tsx · not-found.tsx
├── features/                   Domain modules
│   ├── auth/                   schemas · queries · actions · redirect · components/
│   └── billing/                schemas · queries · actions · customers · webhook-handlers · enums · format · components/
├── components/
│   ├── ui/                     shadcn/ui (Base UI) — add via CLI
│   └── providers.tsx · theme-provider.tsx · theme-toggle.tsx
├── config/                     routes.ts · site.ts
├── lib/
│   ├── env/                    client.ts · server.ts
│   ├── actions/result.ts       ActionResult contract
│   ├── api/response.ts         Route Handler envelope
│   ├── supabase/               client · server · admin · session · database.types
│   ├── stripe/server.ts
│   ├── errors.ts · logger.ts · utils.ts
├── hooks/                      use-mobile.ts
├── test/                       Vitest setup
└── proxy.ts                    Session refresh + route protection
supabase/migrations/            SQL migrations (profiles, billing)
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

- **Hooks** format and lint each edited file, block edits to secrets and committed migrations, block remote Supabase pushes and force pushes, and refuse to end a turn while type-check fails.
- **Rules** load per path (`src/app`, `src/features`, `supabase`, …).
- **Agents**: `code-reviewer`, `database-reviewer`, `security-reviewer` (read-only).
- **Commands**: `/add-feature`, `/add-migration`, `/add-component`, `/review`.
- **MCP servers** (`.mcp.json`): shadcn registry, Supabase (read-only), Stripe. The hosted servers ask you to sign in on first use.

## Environment variables

All variables are required (see `.env.example`):

| Variable                        | Scope  | Purpose                                           |
| ------------------------------- | ------ | ------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | public | Absolute origin for auth and Stripe redirect URLs |
| `NEXT_PUBLIC_SUPABASE_URL`      | public | Supabase project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (RLS applies)                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | server | Admin client for webhooks; bypasses RLS           |
| `STRIPE_SECRET_KEY`             | server | Stripe API key                                    |
| `STRIPE_WEBHOOK_SECRET`         | server | Signing secret for `/api/webhooks/stripe`         |

## Deploying

1. Create a hosted Supabase project and apply the migrations from your machine with `npx supabase link` then `npx supabase db push` (agents are blocked from doing this).
2. In the Supabase Dashboard → Authentication → URL Configuration, set **Site URL** to your domain and add `https://<your-domain>/auth/callback` to **Redirect URLs**.
3. In Stripe (live mode) add a webhook endpoint for `https://<your-domain>/api/webhooks/stripe` subscribed to: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, `price.deleted`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Use its signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Set all six environment variables on your host (Vercel or any Node.js platform that runs Next.js) and deploy.

## Learn more

- [Next.js](https://nextjs.org/docs) · [Supabase](https://supabase.com/docs) · [Stripe](https://docs.stripe.com) · [shadcn/ui](https://ui.shadcn.com) · [Base UI](https://base-ui.com/) · [Tailwind CSS](https://tailwindcss.com/docs) · [TanStack Query](https://tanstack.com/query/latest)
