import { describe, expect, it } from "vitest"

import { ROUTES } from "@/config/routes"
import { emailRedirectUrl, sanitizeNextPath } from "@/features/auth/redirect"
import { clientEnv } from "@/lib/env/client"

describe("sanitizeNextPath", () => {
  it("defaults empty values to the fallback", () => {
    expect(sanitizeNextPath(null)).toBe("/")
    expect(sanitizeNextPath(undefined, "/dashboard")).toBe("/dashboard")
  })

  it("allows a same-origin path", () => {
    expect(sanitizeNextPath("/dashboard?tab=1")).toBe("/dashboard?tab=1")
  })

  it("rejects protocol-relative paths", () => {
    expect(sanitizeNextPath("//evil.com")).toBe("/")
  })

  it("rejects backslash parser-confusion paths", () => {
    expect(sanitizeNextPath("/\\evil.com")).toBe("/")
  })

  it("rejects values without a leading slash and absolute URLs", () => {
    expect(sanitizeNextPath("@evil.com")).toBe("/")
    expect(sanitizeNextPath("https://evil.com")).toBe("/")
  })
})

describe("emailRedirectUrl", () => {
  it("points at the PKCE callback on the configured site with next attached", () => {
    const url = new URL(emailRedirectUrl("/billing"))
    expect(url.origin).toBe(new URL(clientEnv.NEXT_PUBLIC_SITE_URL).origin)
    expect(url.pathname).toBe(ROUTES.authCallback)
    expect(url.searchParams.get("next")).toBe("/billing")
  })

  it("encodes a next value with its own query string", () => {
    const url = new URL(emailRedirectUrl("/dashboard?tab=1"))
    expect(url.searchParams.get("next")).toBe("/dashboard?tab=1")
  })
})
