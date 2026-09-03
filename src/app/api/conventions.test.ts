import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

/**
 * Structural checks for HTTP entry points. Runs on source text so a new
 * `route.ts` that skips the shared handler layer fails CI.
 * The convention lives in .claude/rules/api-routes.md.
 */
const appDir = path.join(import.meta.dirname, "..")

const findRouteFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return findRouteFiles(full)
    return entry === "route.ts" ? [full] : []
  })

const routeFiles = findRouteFiles(appDir).map((file) => ({
  rel: path.relative(appDir, file).split(path.sep).join("/"),
  source: readFileSync(file, "utf8"),
}))

const apiRoutes = routeFiles.filter((route) => route.rel.startsWith("api/"))
const redirectRoutes = routeFiles.filter(
  (route) => !route.rel.startsWith("api/")
)

const NEXT_ROUTE_EXPORTS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "runtime",
  "dynamic",
  "revalidate",
  "maxDuration",
  "preferredRegion",
])

const exportedNames = (source: string) =>
  Array.from(
    source.matchAll(/^export\s+(?:const|async function|function)\s+(\w+)/gm),
    (match) => match[1] ?? ""
  )

describe("route files", () => {
  it("exist", () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  it.each(routeFiles)(
    "$rel exports only Next.js route fields",
    ({ source }) => {
      for (const name of exportedNames(source)) {
        expect(
          NEXT_ROUTE_EXPORTS.has(name),
          `unexpected export "${name}"`
        ).toBe(true)
      }
    }
  )

  it.each(routeFiles)(
    "$rel never uses console or process.env",
    ({ source }) => {
      expect(source).not.toMatch(/\bconsole\./)
      expect(source).not.toMatch(/process\.env/)
    }
  )
})

describe("JSON API routes (src/app/api/**)", () => {
  it.each(apiRoutes)(
    "$rel uses createHandler and the envelope",
    ({ source }) => {
      expect(source).toMatch(/createHandler\(/)
      expect(source).toMatch(/from "@\/lib\/api\/handler"/)
      expect(source).not.toMatch(/NextResponse\.json/)
      expect(source).not.toMatch(/new Response\(/)
    }
  )

  it.each(apiRoutes)(
    "$rel does not reach the admin client directly",
    ({ source }) => {
      expect(source).not.toMatch(/@\/lib\/supabase\/admin/)
    }
  )
})

describe("webhook routes (src/app/api/webhooks/<provider>)", () => {
  const webhookRoutes = apiRoutes.filter((route) =>
    route.rel.startsWith("api/webhooks/")
  )

  it.each(webhookRoutes)(
    "$rel verifies via lib/<provider>/webhooks and dispatches to a feature",
    ({ rel, source }) => {
      expect(rel).toMatch(/^api\/webhooks\/[a-z0-9-]+\/route\.ts$/)
      expect(source).toMatch(/from "@\/lib\/[a-z0-9-]+\/webhooks"/)
      expect(source).toMatch(/from "@\/features\/[a-z0-9-]+\/webhook-handlers"/)
      expect(source).toMatch(/export const runtime = "nodejs"/)
    }
  )
})

describe("redirect routes (outside src/app/api)", () => {
  it.each(redirectRoutes)(
    "$rel lives under auth/ and only redirects",
    ({ rel, source }) => {
      expect(rel).toMatch(/^auth\//)
      expect(source).toMatch(/NextResponse\.redirect\(/)
      expect(source).not.toMatch(/NextResponse\.json/)
    }
  )
})
