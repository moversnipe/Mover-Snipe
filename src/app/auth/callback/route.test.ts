import { describe, expect, it } from "vitest"

import { sanitizeNextPath } from "@/app/auth/callback/route"

describe("sanitizeNextPath", () => {
  it("defaults null to /", () => {
    expect(sanitizeNextPath(null)).toBe("/")
  })

  it("allows a same-origin path", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard")
  })

  it("rejects protocol-relative paths", () => {
    expect(sanitizeNextPath("//evil.com")).toBe("/")
  })

  it("rejects backslash parser-confusion paths", () => {
    expect(sanitizeNextPath("/\\evil.com")).toBe("/")
  })

  it("rejects values without a leading slash", () => {
    expect(sanitizeNextPath("@evil.com")).toBe("/")
  })

  it("rejects absolute URLs", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/")
  })
})
