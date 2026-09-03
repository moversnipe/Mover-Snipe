---
paths:
  - "src/features/**"
---

# Feature module rules (`src/features/<domain>/`)

A feature owns everything about one domain (auth, billing, ...). Files inside a
feature have fixed names so any agent can find them:

| File               | Contains                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemas.ts`       | Zod schemas and inferred types. Shared by client validation and Server Actions.                                                                                                                                                                                    |
| `queries.ts`       | Server-only reads (`import "server-only"`), wrapped in `React.cache`. Return typed rows; throw on Supabase errors with `throwIfError(error, "<context>")` from `@/lib/supabase/errors`, never `throw error` (postgrest-js returns a plain object, not an `Error`). |
| `actions.ts`       | Server Actions (`"use server"`). See `server-actions.md`.                                                                                                                                                                                                          |
| `components/*.tsx` | UI for this feature. Client Components only where needed.                                                                                                                                                                                                          |
| `*.test.ts(x)`     | Tests next to the file they cover.                                                                                                                                                                                                                                 |
| other `*.ts`       | Pure helpers (`format.ts`, `redirect.ts`) or integrations (`customers.ts`, `webhook-handlers.ts`).                                                                                                                                                                 |

- Features import from `@/lib`, `@/config`, `@/components`, and from other features' files. Never import from `@/app`.
- No barrel `index.ts` files: import the concrete module (`@/features/auth/queries`). Barrels defeat tree-shaking and hide dependencies.
- Feature components take data as props from the page; they do not fetch on their own unless they are Client Components using TanStack Query.
- Keep the admin client out of features except where the row cannot be read under RLS on purpose (`billing/customers.ts`, `billing/webhook-handlers.ts`). Comment why each time.
- A new feature starts with the folder, `schemas.ts`, and `queries.ts`; add `actions.ts` only when it mutates data.
