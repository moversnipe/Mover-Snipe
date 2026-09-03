import { describe, expect, it } from "vitest"

import {
  credentialsSchema,
  forgotPasswordSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas"

describe("credentialsSchema", () => {
  it("accepts a valid email and an 8+ character password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "longenough",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a short password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "short",
    })
    expect(result.success).toBe(false)
  })
})

describe("signUpSchema", () => {
  it("accepts matching passwords", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      confirmPassword: "longenough",
    })
    expect(result.success).toBe(true)
  })

  it("reports a mismatch on the confirmation field", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      confirmPassword: "different",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["confirmPassword"])
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts an email on its own", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success
    ).toBe(true)
  })

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false
    )
  })
})

describe("updatePasswordSchema", () => {
  it("accepts a long enough password typed twice", () => {
    const result = updatePasswordSchema.safeParse({
      password: "longenough",
      confirmPassword: "longenough",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a short password", () => {
    const result = updatePasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    })
    expect(result.success).toBe(false)
  })

  it("reports a mismatch on the confirmation field", () => {
    const result = updatePasswordSchema.safeParse({
      password: "longenough",
      confirmPassword: "longenoug",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["confirmPassword"])
  })
})
