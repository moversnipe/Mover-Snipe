---
paths:
  - "supabase/functions/**"
  - "supabase/config.toml"
---

# Edge Function rules (`supabase/functions/`)

This project runs on **JWT signing keys** and **publishable/secret API keys**.
The platform's built-in `verify_jwt` gateway check only understands the legacy
JWT-based keys, so it is **off for every function** and authorisation happens
in code. `supabase/functions.test.ts` fails CI when a function breaks this.

- Every function `supabase/functions/<name>/index.ts` has a matching block in `supabase/config.toml`:

  ```toml
  [functions.<name>]
  verify_jwt = false
  ```

  Never set `verify_jwt = true` anywhere.

- Every function is wrapped in `withSupabase({ auth: <mode> }, handler)` from `npm:@supabase/server@1` and exported as `export default { fetch: ... }`. Pick the narrowest mode: `'user'` for calls from signed-in users (`ctx.supabase` is RLS-scoped, `ctx.userClaims` is the verified identity), `'secret'` for service-to-service calls carrying a secret key on the `apikey` header (`ctx.supabaseAdmin`), `'publishable'` for anonymous app callers, `'none'` only for provider-signed webhooks where you verify the signature yourself.
- Read keys only through the SDK or the platform-provided variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS` (JSON objects keyed by key name; `default` unless you created more). Never reference `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- Responses use the same envelope as the Next.js API: `{ data }` or `{ error: { code, message } }` with `ErrorCode` strings.
- Deno runtime: `npm:`/`jsr:`/`node:` import prefixes, `Deno.env.get` for extra secrets set with `supabase secrets set`. Shared code goes in `supabase/functions/_shared/`. These files are excluded from the Next.js TypeScript, ESLint, and Prettier runs.
- Local: `npm run functions:serve` (honours `verify_jwt` from config.toml). Deploy with `npx supabase functions deploy <name>`; the user runs deploys.
- See the vendored `supabase` skill rule `writing-supabase-edge-functions.md` for general Deno guidance; this file wins on auth.
