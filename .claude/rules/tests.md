---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
  - "supabase/**/*.test.ts"
---

# Testing rules

- Runner: Vitest + Testing Library, jsdom, configured in `vitest.config.mts`; setup in `src/test/setup.ts`.
- Tests sit next to the file they cover: `format.ts` → `format.test.ts`. No `__tests__` folders. Three tests are structural rather than colocated, and check source text so a convention break fails CI without a database or a running app: `supabase/migrations.test.ts` (migration file names, RLS policy naming), `supabase/functions.test.ts` (`verify_jwt = false` and `withSupabase` per Edge Function), and `src/app/api/conventions.test.ts` (the shape of every `route.ts`). `vitest.config.mts` includes `supabase/**/*.test.ts` for the first two.
- Name suites after the export under test and cases after behaviour: `describe("formatPrice")`, `it("formats recurring prices with their interval")`.
- Test pure logic directly (helpers, schemas, result mappers, route policy). Test components through roles and labels (`getByRole`, `getByLabelText`), never by class names.
- Do not hit Supabase or Stripe in unit tests. Extract the logic to a pure function and test that; mock modules only at the boundary (`vi.mock("@/lib/stripe/server")`).
- `server-only` is aliased to a stub in tests, so server modules can be imported directly.
- Test files are the only place outside `src/lib/env/` allowed to touch `process.env`, and only to bootstrap: `src/test/setup.ts` seeds public placeholders with `??=` before `clientEnv` is imported, and the two `supabase/*.test.ts` files read a directory override (`MIGRATIONS_DIR`, `SUPABASE_DIR`) so the checks can be pointed at a fixture and proven to fail. Never read configuration from `process.env` in a test; import `clientEnv`/`serverEnv`.
- Every new pure helper in `src/lib/` or `src/features/` ships with a test. Every bug fix adds the failing case first.
- Run `npm test` (or `npm run check`) before finishing.
