---
name: supabase
description: Supabase database guidelines for PostgreSQL, RLS policies, migrations, database functions, realtime subscriptions, and edge functions. Use when writing SQL, creating tables, implementing row-level security, setting up realtime features, or creating edge functions.
metadata:
  author: jakedahn
  version: "1.0.0"
---

# Supabase Guidelines

Guidelines for Supabase development including database schema, security, and edge functions.

## When to Apply

Reference these guidelines when:

- Writing database migrations or schema changes
- Creating or modifying RLS policies
- Writing PostgreSQL functions
- Implementing realtime subscriptions
- Creating Supabase Edge Functions
- Working with Supabase client in Next.js

## Rule Categories by Priority

| Priority | Category           | File                                       |
| -------- | ------------------ | ------------------------------------------ |
| CRITICAL | RLS Policies       | `rules/create-rls-policies.md`             |
| HIGH     | Migrations         | `rules/create-migration.md`                |
| HIGH     | Database Functions | `rules/create-db-functions.md`             |
| MEDIUM   | SQL Style          | `rules/postgres-sql-style-guide.md`        |
| MEDIUM   | Realtime           | `rules/use-realtime.md`                    |
| MEDIUM   | Edge Functions     | `rules/writing-supabase-edge-functions.md` |

## Quick Reference

### RLS Policies (CRITICAL)

- Use `(select auth.uid())` with select wrapper for performance
- Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
- Always specify roles with `TO authenticated` or `TO anon`
- Add indexes on columns used in policies
- SELECT uses USING, INSERT uses WITH CHECK, UPDATE uses both, DELETE uses USING

- Define schemas in `supabase/schemas/*.sql`
- Generate migrations with `supabase db diff -f <name>`
- Stop local Supabase before diffing
- Schema files execute in lexicographic order

### Migrations (HIGH)

- File format: `YYYYMMDDHHmmss_description.sql`
- Always enable RLS on new tables
- Include header comments explaining purpose
- Write all SQL in lowercase

### Database Functions (HIGH)

- Default to `SECURITY INVOKER`
- Set `search_path = ''` always
- Use fully qualified names (e.g., `public.table_name`)
- Prefer `IMMUTABLE` or `STABLE` over `VOLATILE`

### SQL Style (MEDIUM)

- Lowercase SQL keywords
- snake_case for tables/columns
- Plurals for table names, singular for columns
- Always specify schema (`public.`)
- Use `identity generated always` for IDs

### Realtime (MEDIUM)

- Prefer `broadcast` over `postgres_changes`
- Use private channels with `private: true`
- Topic naming: `scope:entity:id` (e.g., `room:123:messages`)
- Event naming: `entity_action` (e.g., `message_created`)
- Always include cleanup/unsubscribe logic

### Edge Functions (MEDIUM)

- Use `Deno.serve()` not deprecated serve import
- Prefix imports: `npm:`, `jsr:`, or `node:`
- Pre-populated env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
- Shared code goes in `supabase/functions/_shared/`

## How to Use

Read individual rule files for detailed explanations and code examples:

- `rules/create-rls-policies.md`
- `rules/create-migration.md`
- `rules/create-db-functions.md`
- `rules/postgres-sql-style-guide.md`
- `rules/use-realtime.md`
- `rules/writing-supabase-edge-functions.md`
