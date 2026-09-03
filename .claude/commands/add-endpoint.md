---
description: Add a JSON API route, webhook, or auth redirect callback following the endpoint conventions
argument-hint: <api|webhook|callback> <path or provider> <what it does>
---

Add an HTTP endpoint: $ARGUMENTS

Follow `.claude/rules/api-routes.md` exactly.

1. Decide the kind. JSON API → `src/app/api/<resource>/route.ts`. Webhook → `src/app/api/webhooks/<provider>/route.ts` plus `src/lib/<provider>/webhooks.ts` (signature verification) and `src/features/<domain>/webhook-handlers.ts` (event handling and all writes); the route wraps dispatch in `runOnce(webhookEventStore, …)` from `src/lib/api/idempotency.ts` so replays are safe. Redirect callback → `src/app/auth/<flow>/route.ts`.
2. Build the route on `createHandler`, validate with `parseJsonBody`/`parseSearchParams`, authenticate with `getUserOrThrow()` where a user is required, respond with `apiSuccess`/`apiError`, and keep logic in a feature module.
3. Register the path in `ROUTES.api` in `src/config/routes.ts`; add it to `PUBLIC_PATHS` only if anonymous callers must reach it (webhooks, probes) and say why in a comment.
4. Add any new secret to `src/lib/env/server.ts`, `.env.example`, and the CI env block.
5. Add tests for the pure parts (verification helper behaviour, handler dispatch) next to the files. `src/app/api/conventions.test.ts` checks the structure automatically.
6. Run the `security-reviewer` agent, fix findings, then `npm run check`.
