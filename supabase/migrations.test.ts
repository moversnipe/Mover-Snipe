import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/**
 * Convention checks for supabase/migrations/*.sql. Runs without a database.
 * The naming rule lives in .claude/rules/supabase.md.
 */
// MIGRATIONS_DIR lets the check run against another folder (used to verify
// that the test itself fails on badly named policies).
const migrationsDir =
  process.env.MIGRATIONS_DIR ?? path.join(import.meta.dirname, "migrations")
const migrationFiles = readdirSync(migrationsDir).filter((file) =>
  file.endsWith(".sql")
)

const VERB_BY_OPERATION: Record<string, string> = {
  select: "view",
  insert: "create",
  update: "update",
  delete: "delete",
}

const POLICY_NAME =
  /^([A-Z][a-z]+(?: [a-z]+)*) can (view|create|update|delete) ([a-z][^.]*[^.\s])$/

const POLICY_STATEMENT =
  /create policy\s+"([^"]+)"\s+on\s+public\.(\w+)\s+for\s+(select|insert|update|delete|all)\s+to\s+([^\n]+?)\s+(?:using|with check)/g

type Policy = {
  file: string
  name: string
  table: string
  operation: string
  roles: string[]
}

const policies: Policy[] = migrationFiles.flatMap((file) => {
  const sql = readFileSync(path.join(migrationsDir, file), "utf8")
  return Array.from(sql.matchAll(POLICY_STATEMENT), (match) => ({
    file,
    name: match[1] ?? "",
    table: match[2] ?? "",
    operation: match[3] ?? "",
    roles: (match[4] ?? "").split(",").map((role) => role.trim()),
  }))
})

describe("migration file names", () => {
  it("follow YYYYMMDDHHmmss_description.sql", () => {
    for (const file of migrationFiles) {
      expect(file).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/)
    }
  })
})

describe("RLS policy names", () => {
  it("exist for every policy statement parsed", () => {
    expect(policies.length).toBeGreaterThan(0)
  })

  it.each(policies)(
    '$file: "$name" follows "<Audience> can <verb> <object>"',
    ({ name, operation, roles }) => {
      expect(name.length).toBeLessThanOrEqual(63)
      expect(operation).not.toBe("all")

      const match = POLICY_NAME.exec(name)
      expect(match, `"${name}" does not match the naming shape`).not.toBeNull()
      if (!match) return

      const [, audience, verb] = match
      expect(verb).toBe(VERB_BY_OPERATION[operation])

      if (audience === "Users") {
        expect(roles).toEqual(["authenticated"])
      }
      if (audience === "Anyone") {
        expect(roles.sort()).toEqual(["anon", "authenticated"])
      }
    }
  )
})
