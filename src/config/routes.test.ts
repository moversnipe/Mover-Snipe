import { describe, expect, it } from "vitest"

import { ROUTES, isAuthEntryPath, isPublicPath } from "@/config/routes"

describe("isPublicPath", () => {
  it("treats the home page as public", () => {
    expect(isPublicPath(ROUTES.home)).toBe(true)
  })

  it("treats auth pages and their sub-paths as public", () => {
    expect(isPublicPath(ROUTES.login)).toBe(true)
    expect(isPublicPath(ROUTES.signUp)).toBe(true)
    expect(isPublicPath(ROUTES.signUpSuccess)).toBe(true)
    expect(isPublicPath(ROUTES.forgotPassword)).toBe(true)
    expect(isPublicPath(`${ROUTES.authCallback}/anything`)).toBe(true)
  })

  it("keeps the password update page behind a session", () => {
    expect(isPublicPath(ROUTES.updatePassword)).toBe(false)
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

describe("isAuthEntryPath", () => {
  it("matches the pages only anonymous visitors should see", () => {
    expect(isAuthEntryPath(ROUTES.login)).toBe(true)
    expect(isAuthEntryPath(ROUTES.signUp)).toBe(true)
    expect(isAuthEntryPath(ROUTES.signUpSuccess)).toBe(true)
    expect(isAuthEntryPath(ROUTES.forgotPassword)).toBe(true)
  })

  it("leaves the paths that are reached with a session alone", () => {
    expect(isAuthEntryPath(ROUTES.authCallback)).toBe(false)
    expect(isAuthEntryPath(ROUTES.updatePassword)).toBe(false)
    expect(isAuthEntryPath(ROUTES.authError)).toBe(false)
  })

  it("does not match app pages", () => {
    expect(isAuthEntryPath(ROUTES.dashboard)).toBe(false)
    expect(isAuthEntryPath("/auth/login-something")).toBe(false)
  })
})
