---
paths:
  - "src/app/api/**"
---

# Route Handler rules (`src/app/api/`)

Route Handlers exist for callers that are not our UI: webhooks, health checks,
third-party integrations. Our own forms and buttons use Server Actions. The
auth callback at `src/app/auth/callback/route.ts` is the one handler outside
this folder; it exists because Supabase Auth redirects to it.

- Folder per resource, versionless, kebab-case: `api/webhooks/stripe/route.ts`, `api/health/route.ts`.
- Export handlers as `export const GET = async (request: Request) => {...}` (or `POST`, ...); omit the `request` parameter when unused. Only Next.js-recognised exports (`GET`, `POST`, `runtime`, `dynamic`, ...) may leave a `route.ts`; put helpers in `src/features/` or `src/lib/` so they can be unit-tested.
- Always respond through `apiSuccess` / `apiError` from `src/lib/api/response.ts`, so every response is `{ data }` or `{ error: { code, message } }` with the status derived from `ErrorCode`.
- Validate input with Zod before use. Return `ErrorCode.VALIDATION` on failure.
- Log with `logger` from `src/lib/logger.ts`, never `console.*`. Never log secrets, tokens, or raw bodies.
- Webhooks verify signatures on the raw body (`await request.text()`) before parsing, run on `runtime = "nodejs"`, and return a non-2xx status on handler failure so the sender retries.
- Handlers that need a user call `getUser()` from `src/features/auth/queries.ts` and return `ErrorCode.UNAUTHENTICATED` when null.
- The admin client is allowed only in webhook handlers and never in handlers reachable by end users.
