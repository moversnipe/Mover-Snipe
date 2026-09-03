# CLAUDE.md

Guidance for Claude Code in this repository. This file holds what applies
everywhere. Path-specific rules live in `.claude/rules/` and load automatically
when you touch matching files; read the relevant one before editing.

Everything stated here is verified against the code. If you change behaviour,
update this file, the rules, and `README.md` in the same change. Never document
something the code does not do.

## Project

Next.js 16 (App Router, `src/proxy.ts`), React 19, TypeScript 6,
Tailwind CSS 4, shadcn/ui on **Base UI**, **Supabase** (Postgres, Auth, RLS),
**Stripe** (Checkout, Customer Portal, webhooks), TanStack Query,
react-hook-form with zod, and Vitest.

Supabase and Stripe are required. `src/lib/env/` validates every variable at
startup and throws with the missing names.

## Commands

| Command                           | Purpose                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Dev server at http://localhost:3000                                                                                  |
| `npm run check`                   | `format:check` + `lint` + `type-check` + `test`. Run before finishing any task. CI runs the same steps plus `build`. |
| `npm run format` / `format:check` | Prettier (config `.prettierrc`, Tailwind class sorting)                                                              |
| `npm run lint` / `lint:fix`       | ESLint (`eslint.config.mjs`)                                                                                         |
| `npm run type-check`              | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`)                                                                 |
| `npm test` / `test:watch`         | Vitest (`vitest.config.mts`)                                                                                         |
| `npm run build`                   | Production build (needs env vars)                                                                                    |
| `npm run db:start` / `db:stop`    | Local Supabase stack (Docker)                                                                                        |
| `npm run db:reset`                | Recreate the local DB and apply `supabase/migrations/`                                                               |
| `npm run db:migration -- <name>`  | New timestamped migration file                                                                                       |
| `npm run db:types`                | Regenerate `src/lib/supabase/database.types.ts` from the local DB                                                    |
| `npm run stripe:listen`           | Stripe CLI: forward webhooks to the dev server                                                                       |
| `npx shadcn@latest add <name>`    | Add a shadcn/ui component                                                                                            |

## Repository layout

```
.claude/                 Claude Code setup: settings.json, hooks/, rules/, agents/, commands/, skills/
.github/                 CI (lint, type-check, test, build) and Dependabot
supabase/migrations/     SQL migrations (immutable once merged or applied)
src/
  app/                   Routes only. Thin pages/layouts; no business logic.
    (marketing)/         Public pages            -> /
    (app)/               Signed-in pages         -> /dashboard, /billing (layout calls requireUser)
    auth/                Login, PKCE callback, auth error page
    api/                 Route Handlers: health, Stripe webhook
    layout.tsx, error.tsx, global-error.tsx, loading.tsx, not-found.tsx, globals.css
  features/<domain>/     Domain code: schemas.ts, queries.ts, actions.ts, components/, helpers, tests
    auth/                Credentials schema, getUser/requireUser, sign-in/up/out, login form
    billing/             Products/prices/subscription queries, checkout + portal actions, webhook handlers
  components/ui/         Vendored shadcn/ui (Base UI). Add via CLI; do not hand-edit.
  components/            App-wide, domain-free pieces (providers, theme toggle)
  config/                routes.ts (ROUTES, public paths), site.ts (name, URL, absoluteUrl)
  lib/                   Domain-free infrastructure (see .claude/rules/lib.md)
    env/                 Zod-validated clientEnv / serverEnv (only place that reads process.env)
    errors.ts            ErrorCode, AppError, HTTP status map
    actions/result.ts    ActionResult contract for Server Actions
    api/response.ts      apiSuccess / apiError for Route Handlers
    logger.ts            Structured JSON logger
    supabase/            client.ts, server.ts, admin.ts, session.ts, database.types.ts
    stripe/server.ts     Stripe SDK instance (server-only)
  hooks/                 Client hooks (use-*.ts)
  test/                  Vitest setup and the server-only stub
  proxy.ts               Session refresh + route protection (Next.js 16 "proxy", formerly middleware)
```

## Where code goes

| You need to…                               | Put it in                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Add a page                                 | `src/app/(app)/<name>/page.tsx` (protected) or `src/app/(marketing)/` (public); register in `src/config/routes.ts` |
| Read data on the server                    | `src/features/<domain>/queries.ts` (`server-only`, `React.cache`, explicit columns)                                |
| Mutate data from our UI                    | `src/features/<domain>/actions.ts` Server Action returning `ActionResult`                                          |
| Accept calls from outside (webhook, probe) | `src/app/api/<resource>/route.ts` using `apiSuccess`/`apiError`                                                    |
| Validate input                             | Zod schema in `src/features/<domain>/schemas.ts`, shared by client and server                                      |
| Add domain UI                              | `src/features/<domain>/components/`                                                                                |
| Add a reusable primitive                   | `npx shadcn@latest add <name>` into `src/components/ui/`                                                           |
| Add a table                                | New file in `supabase/migrations/` with RLS, then `npm run db:types`                                               |
| Add an env var                             | Schema in `src/lib/env/`, `.env.example`, CI env block in `.github/workflows/ci.yml`                               |
| Add an error kind                          | `ErrorCode` in `src/lib/errors.ts`                                                                                 |
| Add a route path                           | `ROUTES` in `src/config/routes.ts`                                                                                 |

## Naming

| Thing                   | Convention                                                                                                                               | Example                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Files and folders       | kebab-case                                                                                                                               | `login-form.tsx`, `webhook-handlers.ts`                                       |
| React components        | PascalCase export, file kebab-case                                                                                                       | `export const LoginForm` in `login-form.tsx`                                  |
| Hooks                   | `use-<name>.ts` exporting `use<Name>`                                                                                                    | `use-mobile.ts` → `useIsMobile`                                               |
| Functions and variables | camelCase, verbs for functions                                                                                                           | `getActiveSubscription`, `formatPrice`                                        |
| Event handlers          | `handle<Event>`                                                                                                                          | `handleSubmit`, `handleKeyDown`                                               |
| Booleans                | `is`/`has`/`can` prefix                                                                                                                  | `isPending`, `hasSubscription`                                                |
| Constants               | UPPER_SNAKE for module-level literals, camelCase for config objects                                                                      | `MOBILE_BREAKPOINT`, `siteConfig`                                             |
| Types and interfaces    | PascalCase, no `I` prefix; prefer `type`                                                                                                 | `ActionResult`, `LoginFormProps`                                              |
| Props type              | `<Component>Props`                                                                                                                       | `PricingTableProps`                                                           |
| Zod schemas             | `<thing>Schema`, inferred type `<Thing>Input`                                                                                            | `credentialsSchema`, `CredentialsInput`                                       |
| Server Actions          | verb phrase                                                                                                                              | `signIn`, `startCheckout`, `openBillingPortal`                                |
| Queries                 | `get<Thing>` / `require<Thing>`                                                                                                          | `getUser`, `requireUser`                                                      |
| Feature files           | fixed names                                                                                                                              | `schemas.ts`, `queries.ts`, `actions.ts`, `components/`                       |
| Tests                   | colocated `<file>.test.ts(x)`                                                                                                            | `format.test.ts`                                                              |
| Route segments          | kebab-case, groups in parentheses                                                                                                        | `auth-code-error/`, `(app)/`                                                  |
| SQL                     | snake_case; plural tables, singular columns, `<table_singular>_id` FKs                                                                   | `subscriptions.user_id`                                                       |
| RLS policies            | `"<Audience> can <verb> <object>"`; verb by operation (view/create/update/delete); ≤ 63 chars; enforced by `supabase/migrations.test.ts` | `"Users can view their own subscriptions"`, `"Anyone can view active prices"` |
| Enums (Postgres)        | snake_case type, snake_case values                                                                                                       | `subscription_status`, `past_due`                                             |
| Env vars                | UPPER_SNAKE; `NEXT_PUBLIC_` only when the browser needs it                                                                               | `STRIPE_WEBHOOK_SECRET`                                                       |
| Error codes             | snake_case strings behind `ErrorCode.X`                                                                                                  | `ErrorCode.NOT_FOUND` = `"not_found"`                                         |

## Code style

- `const` arrow functions everywhere: `const handleClick = () => {}`. Two exceptions: `src/components/ui/` keeps upstream `function` style, and Next.js entry files still need `export default <Component>` after the `const`. Prefer `type` over `interface`.
- Early returns; no nested ternaries beyond one level; descriptive names over comments.
- TypeScript strict. No `any`, no non-null `!` except immediately after a check, no `as` casts to silence errors. Index access is `T | undefined` (`noUncheckedIndexedAccess`): handle it.
- Imports, in groups separated by blank lines: `react`/`next`, third-party, `@/config`, `@/features`, `@/components`, `@/lib`, relative. Always use the `@/` alias; never barrel files.
- `cn()` from `src/lib/utils.ts` for conditional classes. Design tokens from `globals.css`, no hex literals.
- Logging only via `logger` from `src/lib/logger.ts`; `console.*` is allowed only in `error.tsx` boundaries, tests, and hooks.
- `process.env` is read only in `src/lib/env/`.
- Prettier formats on save and in the PostToolUse hook; do not fight it.

## Server vs Client, data fetching

- Default to Server Components. `"use client"` only for interactivity, browser APIs, or hooks; keep client components small and at the leaves.
- Server reads go through `features/<domain>/queries.ts`. Pages run independent reads with `Promise.all`.
- Client-side data (live updates, polling, optimistic UI) uses TanStack Query (`src/components/providers.tsx`). Do not add SWR.
- Realtime uses Supabase private `broadcast` channels in Client Components. Do not add `postgres_changes` listeners.
- Follow the `vercel-react-best-practices` skill for waterfalls, bundle size, and re-renders.

## Server Actions (summary; full contract in `.claude/rules/server-actions.md`)

`"use server"` file → Zod validation → `getUser()` → RLS-scoped work → return
`ok()`/`fail()`/`failValidation()`/`failFromError()` from `src/lib/actions/result.ts`
→ `revalidatePath` → `redirect()` outside `try/catch`. Client binds with
`useActionState(action, undefined)` and reads `fieldError(state, "field")`.
`useFormStatus()` is the correct hook for pending state in child submit buttons.
Redirect-only, input-less actions such as `signOut` may return `Promise<void>`.
Error messages returned to users are fixed strings; provider messages are logged, never forwarded.

## Errors

- Expected failures: `throw new AppError(ErrorCode.X, "user-safe message")`.
- Unexpected failures: let them throw; `failFromError`/`toUserMessage` map them to `ErrorCode.INTERNAL` with a generic message.
- Route Handlers: `apiError(code, message)`; status comes from `ERROR_STATUS`.
- Error boundaries show `error.digest`, never `error.message`.

## Supabase (summary; full rules in `.claude/rules/supabase.md` and the `supabase` skill)

- `await createClient()` (server) / `createClient()` (browser) run as the user under RLS. `createAdminClient()` bypasses RLS and is used only in `features/billing/customers.ts` and `features/billing/webhook-handlers.ts`.
- Every table has RLS enabled, one policy per operation and audience, `to <role>`, `(select auth.uid())`, indexes on policy and foreign-key columns. Private tables have no policies and a comment saying so.
- Migrations are immutable once on `main` or applied to any database. After adding one: `npm run db:reset`, `npm run db:types`, commit both.
- Explicit column lists in every `select`.

## Stripe (summary; full rules in `.claude/rules/stripe.md`)

- The webhook is the only writer of `products`, `prices`, `subscriptions` (and `customers` together with `getOrCreateStripeCustomerId`).
- `startCheckout` re-validates the price id against the database before creating a session.
- Period fields come from `subscription.items.data[0]`; Stripe enums are parsed with `features/billing/enums.ts`.

## UI (summary; full rules in `.claude/rules/ui-components.md`)

- shadcn/ui on Base UI: `<DialogTrigger render={<Button />}>` — `asChild` does not exist here.
- Add primitives with the CLI; compose in feature components; tokens from `globals.css`; light and dark must both work.
- Accessibility is required: semantic HTML, labelled controls, keyboard access, `sr-only` text on icon buttons.
- For new UI, load the `frontend-design` skill and stay inside its "Constraints for this repository" section.

## Testing

Vitest + Testing Library, colocated `*.test.ts(x)`. Test pure logic directly;
test components by role/label; never call Supabase or Stripe in tests. New
helpers ship with tests. See `.claude/rules/tests.md`.

## Environment variables

All required; see `.env.example`. Public: `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server-only:
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
Never read, print, or write `.env.local`; hooks block it. Document new
variables in `.env.example` and ask the user to set them.

## Security rules (always)

1. Validate on the server with Zod; client validation is UX only.
2. Authenticate inside every action and protected handler with `getUser()`; the proxy and layout are defence in depth, not the check.
3. Authorise via RLS with the user's client; never widen a query with the admin client to "make it work".
4. Sanitize user-supplied redirect targets with `sanitizeNextPath`.
5. Verify webhook signatures on the raw body before touching the payload.
6. Never expose raw error messages, stack traces, or ids of other users.
7. `server-only` on every module that imports a secret.

## Git

- Conventional Commits: `feat(billing): add proration preview`, `fix(auth): …`, `chore:`, `docs:`, `refactor:`, `test:`.
- Branches: `feature/<slug>`, `fix/<slug>`. Small, reviewable PRs. `npm run check` must pass before commit; CI runs it plus `build`.
- Never force-push or rewrite shared history (hook enforced). Never run remote Supabase commands; the user applies migrations to hosted projects.

## Claude Code setup in this repo

- **`.claude/settings.json`** — allowlist for the npm/npx/git commands above; denies reading `.env*` secrets, remote Supabase pushes/resets, force pushes.
- Hooks are **guardrails, not a sandbox**: they catch the mistakes an agent is likely to make and fail closed when they cannot parse their input, but a shell blocklist cannot enumerate every way to read a file. The real controls are that secrets are never committed (`.gitignore`), the Read-tool deny rules, RLS, and human review of the diff.
- **Hooks** (`.claude/hooks/`, all invoked by `settings.json`):
  - `session-start.sh` — installs deps if `node_modules` is missing, warns if `.env.local` is absent.
  - `protect-files.sh` (PreToolUse Edit/Write) — blocks edits to `.env*` secrets, `package-lock.json`, and migrations already on `origin/main` (or `HEAD` if that ref is missing).
  - `guard-bash.sh` (PreToolUse Bash) — blocks remote Supabase ops, force pushes, deleting migrations, reading secret env files.
  - `check-file.sh` (PostToolUse Edit/Write) — Prettier-formats the file and fails the tool call on ESLint errors.
  - `stop-check.sh` (Stop) — refuses to finish a turn while `tsc --noEmit` fails on changed TypeScript.
- **Rules** (`.claude/rules/`, path-scoped): `app-router`, `api-routes`, `features`, `server-actions`, `ui-components`, `lib`, `supabase`, `stripe`, `tests`.
- **Agents** (`.claude/agents/`, read-only reviewers): `code-reviewer`, `database-reviewer`, `security-reviewer`. Run them before committing non-trivial work.
- **Commands** (`.claude/commands/`): `/add-feature`, `/add-migration`, `/add-component`, `/review`.
- **Skills** (`.claude/skills/`): `frontend-design`, `supabase`, `vercel-react-best-practices`, `improve`, `agent-browser` (needs the `agent-browser` CLI installed).
- **MCP servers** (`.mcp.json`): `shadcn` (local, via npx), `supabase` (hosted, read-only; authenticates in the browser on first use), `stripe` (hosted; authenticates on first use).

## Never

`any` · `asChild` · Radix imports · SWR · `postgres_changes` · `select("*")` ·
inline route strings · `process.env` outside `src/lib/env/` · `console.*` in app
code · editing `src/components/ui/` by hand (except commented fixes) · editing a
committed migration · writing to Stripe mirror tables outside the webhook ·
documenting behaviour that does not exist.
