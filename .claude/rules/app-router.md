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
- Route groups: `(marketing)` for public pages, `(app)` for signed-in pages. `(app)/layout.tsx` calls `requireUser()`; add new protected pages inside `(app)` so they inherit the check. Auth pages live under `auth/`, share `auth/layout.tsx`, and are public by name in `src/config/routes.ts` — except `update-password`, which is reached with the session the recovery link created and so calls `requireUser()` itself. Pages an anonymous visitor should see (login, sign-up, sign-up-success, forgot-password) also go in `AUTH_ENTRY_PATHS` so the proxy bounces signed-in users to the app.
- Adding a route means adding it to `ROUTES` in `src/config/routes.ts`, and to `PUBLIC_PATHS` there if anonymous users may reach it. Never write route strings inline.
- `(app)/layout.tsx` is the sidebar shell: `SidebarProvider` (its `defaultOpen` read from the `SIDEBAR_STATE_COOKIE` cookie), `AppSidebar`, and a `SidebarInset` header holding the trigger, breadcrumb, theme toggle, and sign-out. `SidebarInset` already renders `<main>`, so a page must not add its own. A new page under `(app)` gets a `NavItem` in `NAV_SECTIONS` (`src/config/navigation.ts`) to appear in the sidebar.
- `searchParams` and `params` are Promises: `const { next } = await searchParams`.
- Independent data reads in one page run in `Promise.all`, never sequential awaits.
- Set `export const metadata` (or `generateMetadata`) on every page. Titles use the template from the root layout.
- Keep `error.tsx`, `loading.tsx`, `not-found.tsx` at the segment where they apply. `global-error.tsx` must render `<html>` and `<body>` itself.
- Never render `error.message` from an error boundary; show `error.digest` and a generic message.
- Route Handlers live under `src/app/api/` (see `api-routes.md`). The single exception is `auth/callback/route.ts`, the PKCE redirect endpoint Supabase Auth calls back into; it returns redirects, not the JSON envelope, and builds them from `absoluteUrl()` so the target never follows the request's Host header. Prefer Server Actions for mutations triggered by our own UI.
