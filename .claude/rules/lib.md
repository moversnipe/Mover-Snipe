---
paths:
  - "src/lib/**"
  - "src/config/**"
  - "src/hooks/**"
---

# Shared library rules (`src/lib/`, `src/config/`, `src/hooks/`)

`src/lib/` is domain-free infrastructure. If a module knows about users,
subscriptions, or any product concept, it belongs in `src/features/`.

| Module                                   | Purpose                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `lib/env/client.ts`, `lib/env/server.ts` | Zod-validated environment. The only place `process.env` is read. `server.ts` imports `server-only`.                           |
| `lib/errors.ts`                          | `ErrorCode`, `AppError`, HTTP status map, user-safe message helpers. Add codes here, never inline strings.                    |
| `lib/actions/result.ts`                  | `ActionResult` and helpers used by every Server Action.                                                                       |
| `lib/api/handler.ts`                     | `createHandler` wrapper for every JSON API route: params, `AppError` → envelope, unknown → logged 500.                        |
| `lib/api/validate.ts`                    | `parseJsonBody` / `parseSearchParams`; throw `AppError(VALIDATION)`.                                                          |
| `lib/api/idempotency.ts`                 | `runOnce(store, key, handler)` and the `WebhookEventStore` interface: at-most-once processing per `(provider, eventId)`.      |
| `lib/api/webhook-event-store.ts`         | Supabase implementation over `public.webhook_events` (admin client, `claim_webhook_event` RPC).                               |
| `lib/api/response.ts`                    | `apiSuccess`/`apiError` used by every Route Handler.                                                                          |
| `lib/logger.ts`                          | Structured JSON logger. The only allowed logging API outside tests.                                                           |
| `lib/supabase/client.ts`                 | Browser client (Client Components).                                                                                           |
| `lib/supabase/server.ts`                 | Cookie-based server client (RSC, actions, handlers). `server-only`.                                                           |
| `lib/supabase/admin.ts`                  | Service-role client. `server-only`. Bypasses RLS: webhooks and private lookups only.                                          |
| `lib/supabase/session.ts`                | Session refresh and route protection called by `src/proxy.ts`.                                                                |
| `lib/supabase/database.types.ts`         | Generated types. Regenerate with `npm run db:types`; if the local stack is unavailable, mirror the migration exactly by hand. |
| `lib/stripe/server.ts`                   | Stripe SDK instance. `server-only`.                                                                                           |
| `lib/stripe/webhooks.ts`                 | `verifyStripeWebhook(request)`: raw-body signature check, returns the typed event.                                            |
| `lib/utils.ts`                           | `cn()` and other tiny pure helpers.                                                                                           |
| `config/routes.ts`                       | `ROUTES`, `PUBLIC_PATHS`, `isPublicPath`, default authenticated path.                                                         |
| `config/site.ts`                         | Site name, description, URL, `absoluteUrl()`.                                                                                 |
| `hooks/use-*.ts`                         | Client hooks, one per file, named `useX`.                                                                                     |

- Any module that touches a secret imports `"server-only"` as its first line.
- Environment variables are read only through `clientEnv`/`serverEnv`; adding a variable means updating the schema, `.env.example`, and the CI env block in `.github/workflows/ci.yml`.
- Pure helpers get a colocated `*.test.ts`.
