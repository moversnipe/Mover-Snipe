---
paths:
  - "src/app/api/**"
  - "src/app/**/route.ts"
  - "src/lib/api/**"
  - "src/lib/*/webhooks.ts"
---

# HTTP endpoint rules

There are exactly three kinds of HTTP entry point. Every new one is one of
these and is built the same way. `src/app/api/conventions.test.ts` fails CI
when a `route.ts` deviates.

| Kind              | Location                                   | Caller                                               | Response                                                   |
| ----------------- | ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| JSON API          | `src/app/api/<resource>/route.ts`          | Non-UI callers: probes, integrations, mobile clients | `apiSuccess` / `apiError` envelope                         |
| Webhook           | `src/app/api/webhooks/<provider>/route.ts` | A third party pushing events                         | Envelope; non-2xx on handler failure so the sender retries |
| Redirect callback | `src/app/auth/<flow>/route.ts`             | The browser, sent by an auth provider                | `NextResponse.redirect` only                               |

Our own forms and buttons never call an API route; they use Server Actions.

## Every `route.ts`

- Exports only Next.js route fields: `GET`/`POST`/..., `runtime`, `dynamic`, `revalidate`, `maxDuration`, `preferredRegion`. Helpers live in `src/lib/` or `src/features/` so they can be unit-tested.
- Route files are thin: verify, validate, call a feature function, respond. No business logic, no Supabase queries written inline.
- Never `console.*` (use `logger`) and never `process.env` (use `clientEnv`/`serverEnv`).
- Never import `@/lib/supabase/admin` in a route file. Privileged work belongs in the feature module that owns it.

## JSON API routes

```ts
import { z } from "zod"

import { getUserOrThrow } from "@/features/auth/queries"
import { listWidgets } from "@/features/widgets/queries"
import { createHandler } from "@/lib/api/handler"
import { apiSuccess } from "@/lib/api/response"
import { parseSearchParams } from "@/lib/api/validate"

const querySchema = z.object({
  limit: z.coerce.number().int().max(100).default(20),
})

export const GET = createHandler(async ({ request }) => {
  const user = await getUserOrThrow()
  const { limit } = parseSearchParams(request, querySchema)
  return apiSuccess(await listWidgets(user.id, limit))
})
```

- Always wrap with `createHandler` from `src/lib/api/handler.ts`. It resolves `params`, maps a thrown `AppError` to the envelope and status, and turns anything else into a logged generic 500.
- Validate with `parseJsonBody` / `parseSearchParams` from `src/lib/api/validate.ts`; both throw `AppError(VALIDATION)`.
- Authenticate with `getUserOrThrow()` from `src/features/auth/queries.ts`, which throws `AppError(UNAUTHENTICATED)`.
- Signal domain failures by throwing `AppError(code, message)`; the wrapper renders them. Return `apiError` directly only when you need a status the wrapper cannot infer.
- Folder per resource, versionless, kebab-case. Dynamic segments use `[id]` and are typed through `createHandler<{ id: string }>`.

## Webhook routes

Three files, one per layer:

1. `src/lib/<provider>/webhooks.ts` — `verify<Provider>Webhook(request)`: reads the raw body, verifies the signature, returns the typed event, throws `AppError(VALIDATION)` on failure. Reads secrets only from `serverEnv`.
2. `src/features/<domain>/webhook-handlers.ts` — `HANDLED_EVENT_TYPES` and `handle<Provider>Event(event)`. Owns all database writes for that integration. Uses the admin client with a comment explaining why.
3. `src/app/api/webhooks/<provider>/route.ts` — `export const runtime = "nodejs"`, `createHandler`, verify → skip unhandled types with `{ received: true, handled: false }` → `runOnce(webhookEventStore, { provider, eventId, eventType }, () => handle<Provider>Event(event))` → `apiError(INTERNAL)` on failure so the provider retries.

Nothing is written to the database before verification succeeds.

**Idempotency is mandatory.** Every webhook handler runs inside `runOnce` from
`src/lib/api/idempotency.ts`, backed by `public.webhook_events` through
`src/lib/api/webhook-event-store.ts`. The ledger is keyed by
`(provider, event_id)`: replays and concurrent duplicates are skipped with
`outcome: "duplicate"`, a failing handler marks the row `failed` and rethrows
so the provider retries, and a claim abandoned by a crashed worker becomes
claimable again after five minutes. Use the provider's own event id, never a
hash of the payload. The structure test requires `runOnce` in every webhook
route.

## Redirect callbacks

Only auth providers redirect the browser into us, so these live under
`src/app/auth/`. They read query parameters, complete the exchange through the
feature module, pass any `next` value through `sanitizeNextPath`, and end in
`NextResponse.redirect` to a path from `ROUTES`. On failure they redirect to
`ROUTES.authError`, never to a JSON body.

## Adding an endpoint

Use `/add-endpoint`. Then add the path to `ROUTES.api` in
`src/config/routes.ts` (and to `PUBLIC_PATHS` if it must be reachable without a
session, for example a webhook or probe), and document it in `README.md` if it
is part of the deployment story.
