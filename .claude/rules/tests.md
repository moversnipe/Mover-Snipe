---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
---

# Testing rules

- Runner: Vitest + Testing Library, jsdom, configured in `vitest.config.mts`; setup in `src/test/setup.ts`.
- Tests sit next to the file they cover: `format.ts` → `format.test.ts`. No `__tests__` folders.
- Name suites after the export under test and cases after behaviour: `describe("formatPrice")`, `it("formats recurring prices with their interval")`.
- Test pure logic directly (helpers, schemas, result mappers, route policy). Test components through roles and labels (`getByRole`, `getByLabelText`), never by class names.
- Do not hit Supabase or Stripe in unit tests. Extract the logic to a pure function and test that; mock modules only at the boundary (`vi.mock("@/lib/stripe/server")`).
- `server-only` is aliased to a stub in tests, so server modules can be imported directly.
- Every new pure helper in `src/lib/` or `src/features/` ships with a test. Every bug fix adds the failing case first.
- Run `npm test` (or `npm run check`) before finishing.
