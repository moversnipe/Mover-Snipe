import { describe, expect, it } from "vitest"

import { isEmailOtpType } from "@/features/auth/otp"

describe("isEmailOtpType", () => {
  it("accepts the email link types the app sends", () => {
    expect(isEmailOtpType("signup")).toBe(true)
    expect(isEmailOtpType("recovery")).toBe(true)
    expect(isEmailOtpType("email_change")).toBe(true)
  })

  it("rejects anything else", () => {
    expect(isEmailOtpType(null)).toBe(false)
    expect(isEmailOtpType(undefined)).toBe(false)
    expect(isEmailOtpType("")).toBe(false)
    expect(isEmailOtpType("phone_change")).toBe(false)
  })
})
