---
description: Scaffold a new feature module (schemas, queries, actions, components, route) following repo conventions
argument-hint: <domain-name> <one-line description>
---

Scaffold a feature for: $ARGUMENTS

Follow `CLAUDE.md`, `.claude/rules/features.md`, `.claude/rules/server-actions.md`, `.claude/rules/app-router.md`, and `.claude/rules/agent-ready.md`.

1. Create `src/features/<domain>/` with `schemas.ts` and `queries.ts` (server-only, `React.cache`, explicit columns). Add `actions.ts` only if the feature mutates data; every action returns `ActionResult`.
2. Keep each capability callable on its own: one named exported function per read and per write, input validated by a schema from `schemas.ts`, JSON-serialisable output, a one-line doc comment saying what it does and whether it writes, and a bounded `limit` plus a deterministic order on every list read.
3. Put UI in `src/features/<domain>/components/`, using shadcn/ui from `src/components/ui/` (Base UI `render` prop). Client Components only where interactivity needs them.
4. Add the route under `src/app/(app)/<domain>/page.tsx` (or `(marketing)` if public), register it in `src/config/routes.ts`, and set `metadata`.
5. If the feature needs a table, run `/add-migration` first.
6. Add tests for pure helpers and schemas next to the files.
7. Run the `code-reviewer` and `security-reviewer` agents and fix every finding, then `npm run check`.
8. Summarise the files created and anything the user must configure.
