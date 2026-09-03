---
paths:
  - "src/app/**"
---

# App Router rules (`src/app/`)

Routes are thin. A `page.tsx` or `layout.tsx` fetches data through
`src/features/<domain>/queries.ts`, composes feature components, and sets
`metadata`. It contains no business logic, no Supabase or Stripe calls, and no
Zod schemas.

- Every `page.tsx`/`layout.tsx` is a `const` component followed by `export default`; route handlers are named `export const GET/POST`. Next.js requires these export shapes; do not rename them.
- Default to Server Components. Add `"use client"` only for interactivity, browser APIs, or hooks, and put that component in `src/features/<domain>/components/` or `src/components/`, not in `src/app/`.
- Route groups: `(marketing)` for public pages, `(app)` for signed-in pages. `(app)/layout.tsx` calls `requireUser()`; add new protected pages inside `(app)` so they inherit the check. Auth pages live under `auth/` and are public by name in `src/config/routes.ts`.
- Adding a route means adding it to `ROUTES` in `src/config/routes.ts`, and to `PUBLIC_PATHS` there if anonymous users may reach it. Never write route strings inline.
- `searchParams` and `params` are Promises: `const { next } = await searchParams`.
- Independent data reads in one page run in `Promise.all`, never sequential awaits.
- Set `export const metadata` (or `generateMetadata`) on every page. Titles use the template from the root layout.
- Keep `error.tsx`, `loading.tsx`, `not-found.tsx` at the segment where they apply. `global-error.tsx` must render `<html>` and `<body>` itself.
- Never render `error.message` from an error boundary; show `error.digest` and a generic message.
- Route Handlers live only under `src/app/api/` (see `api-routes.md`). Prefer Server Actions for mutations triggered by our own UI.
