import { describe, expect, it } from "vitest"

import { sanitizeNextPath } from "@/features/auth/redirect"

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
