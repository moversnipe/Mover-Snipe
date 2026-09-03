---
description: Scaffold a new feature module (schemas, queries, actions, components, route) following repo conventions
argument-hint: <domain-name> <one-line description>
---

Scaffold a feature for: $ARGUMENTS

Follow `CLAUDE.md`, `.claude/rules/features.md`, `.claude/rules/server-actions.md`, and `.claude/rules/app-router.md`.

1. Create `src/features/<domain>/` with `schemas.ts` and `queries.ts` (server-only, `React.cache`, explicit columns). Add `actions.ts` only if the feature mutates data; every action returns `ActionResult`.
2. Put UI in `src/features/<domain>/components/`, using shadcn/ui from `src/components/ui/` (Base UI `render` prop). Client Components only where interactivity needs them.
3. Add the route under `src/app/(app)/<domain>/page.tsx` (or `(marketing)` if public), register it in `src/config/routes.ts`, and set `metadata`.
4. If the feature needs a table, run `/add-migration` first.
5. Add tests for pure helpers and schemas next to the files.
6. Run the `code-reviewer` and `security-reviewer` agents and fix every finding, then `npm run check`.
7. Summarise the files created and anything the user must configure.
