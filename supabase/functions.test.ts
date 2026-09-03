import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/**
 * Edge Function conventions. Runs on source text.
 * Every function must have `[functions.<name>] verify_jwt = false` in
 * config.toml and authorise in code with withSupabase({ auth: ... }).
 */
// SUPABASE_DIR lets the check run against another folder (used to verify that
// the test itself fails on a misconfigured function).
const supabaseDir = process.env.SUPABASE_DIR ?? import.meta.dirname
const functionsDir = path.join(supabaseDir, "functions")
const config = readFileSync(path.join(supabaseDir, "config.toml"), "utf8")

const functionNames = existsSync(functionsDir)
  ? readdirSync(functionsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name)
  : []

const verifyJwtSetting = (name: string) => {
  const block = new RegExp(
    `^\\[functions\\.${name}\\]\\n((?:(?!^\\[).*\\n?)*)`,
    "m"
  ).exec(config)
  const match = block
    ? /^verify_jwt\s*=\s*(true|false)/m.exec(block[1] ?? "")
    : null
  return match ? match[1] : undefined
}

describe("supabase/config.toml", () => {
  it("never enables gateway JWT verification", () => {
    expect(config).not.toMatch(/^verify_jwt\s*=\s*true/m)
  })

  it("uses local asymmetric signing keys", () => {
    expect(config).toMatch(/^signing_keys_path = "\.\/signing_keys\.json"/m)
  })
})

describe("edge functions", () => {
  it("exist for the template", () => {
    expect(functionNames.length).toBeGreaterThan(0)
  })

  it.each(functionNames)("%s sets verify_jwt = false", (name) => {
    expect(verifyJwtSetting(name)).toBe("false")
  })

  it.each(functionNames)("%s authorises in code with withSupabase", (name) => {
    const source = readFileSync(
      path.join(functionsDir, name, "index.ts"),
      "utf8"
    )
    expect(source).toMatch(/from "npm:@supabase\/server/)
    expect(source).toMatch(/withSupabase\(\s*\{\s*auth:/)
    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY/)
  })
})
