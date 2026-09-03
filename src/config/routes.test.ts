import { describe, expect, it } from "vitest"

import { ROUTES, isPublicPath } from "@/config/routes"

describe("isPublicPath", () => {
  it("treats the home page as public", () => {
    expect(isPublicPath(ROUTES.home)).toBe(true)
  })

  it("treats auth pages and their sub-paths as public", () => {
    expect(isPublicPath(ROUTES.login)).toBe(true)
    expect(isPublicPath(`${ROUTES.authCallback}/anything`)).toBe(true)
  })

  it("treats the Stripe webhook as public", () => {
    expect(isPublicPath(ROUTES.api.stripeWebhook)).toBe(true)
  })

  it("does not treat prefixes of public paths as public", () => {
    expect(isPublicPath("/dashboard")).toBe(false)
    expect(isPublicPath("/api/webhooks")).toBe(false)
    expect(isPublicPath("/authx")).toBe(false)
  })
})
