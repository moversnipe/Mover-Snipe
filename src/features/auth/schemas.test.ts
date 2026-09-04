import { describe, expect, it } from "vitest"

import {
  PASSWORD_RULES,
  credentialsSchema,
  forgotPasswordSchema,
  getUnmetPasswordRules,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas"

const STRONG_PASSWORD = "Str0ng!pass"

describe("PASSWORD_RULES", () => {
  it("covers length, lowercase, uppercase, number, and symbol", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      "length",
      "lowercase",
      "uppercase",
      "number",
      "symbol",
    ])
  })

  it("counts every symbol Supabase Auth accepts", () => {
    for (const symbol of "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~") {
      expect(getUnmetPasswordRules(`Abcdefg1${symbol}`)).toEqual([])
    }
  })
})

describe("getUnmetPasswordRules", () => {
  it("returns nothing for a password that satisfies every rule", () => {
    expect(getUnmetPasswordRules(STRONG_PASSWORD)).toEqual([])
  })

  it("names each rule the password misses, in checklist order", () => {
    expect(getUnmetPasswordRules("abc").map((rule) => rule.id)).toEqual([
      "length",
      "uppercase",
      "number",
      "symbol",
    ])
  })

  it("does not count a space as a symbol", () => {
    expect(getUnmetPasswordRules("Abcdefg1 ").map((rule) => rule.id)).toEqual([
      "symbol",
    ])
  })
})

describe("credentialsSchema", () => {
  it("accepts a valid email and an 8+ character password", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
    })
    expect(result.success).toBe(true)
  })

  it("does not apply the composition rules to an existing password", () => {
    // Accounts created before the rules existed must still be able to sign in.
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "alllowercase",
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

describe("signInSchema", () => {
  it("accepts credentials with or without a next path", () => {
    const base = { email: "user@example.com", password: "longenough" }
    expect(signInSchema.safeParse(base).success).toBe(true)
    expect(signInSchema.safeParse({ ...base, next: "/billing" }).success).toBe(
      true
    )
  })

  it("leaves the shape of next to sanitizeNextPath", () => {
    const base = { email: "user@example.com", password: "longenough" }
    const result = signInSchema.safeParse({
      ...base,
      next: "https://evil.example",
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.next).toBe("https://evil.example")
  })

  it("drops an oversized next instead of failing the sign-in", () => {
    const base = { email: "user@example.com", password: "longenough" }
    const result = signInSchema.safeParse({
      ...base,
      next: `/${"a".repeat(2048)}`,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.next).toBeUndefined()
  })
})

describe("signUpSchema", () => {
  it("accepts an optional next path", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
      next: "/billing",
    })
    expect(result.success).toBe(true)
  })

  it("accepts matching passwords that meet every rule", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ["too short", "Ab1!"],
    ["no lowercase letter", "ABCDEFG1!"],
    ["no uppercase letter", "abcdefg1!"],
    ["no number", "Abcdefgh!"],
    ["no symbol", "Abcdefg1"],
  ])("rejects a password with %s", (_, password) => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["password"])
  })

  it("lists the missing rules in the password message", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.message).toBe(
      "Password needs an uppercase letter, a number, a symbol, such as ! @ # $ %"
    )
  })

  it("reports a mismatch on the confirmation field", () => {
    const result = signUpSchema.safeParse({
      email: "user@example.com",
      password: STRONG_PASSWORD,
      confirmPassword: "Different1!",
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

describe("newPasswordSchema", () => {
  it("accepts a compliant password on its own", () => {
    expect(
      newPasswordSchema.safeParse({ password: STRONG_PASSWORD }).success
    ).toBe(true)
  })

  it("rejects a password that misses a rule", () => {
    expect(
      newPasswordSchema.safeParse({ password: "longenough" }).success
    ).toBe(false)
  })
})

describe("updatePasswordSchema", () => {
  it("accepts a compliant password typed twice", () => {
    const result = updatePasswordSchema.safeParse({
      password: STRONG_PASSWORD,
      confirmPassword: STRONG_PASSWORD,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a password that misses a rule", () => {
    const result = updatePasswordSchema.safeParse({
      password: "longenough",
      confirmPassword: "longenough",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["password"])
  })

  it("reports a mismatch on the confirmation field", () => {
    const result = updatePasswordSchema.safeParse({
      password: STRONG_PASSWORD,
      confirmPassword: "Str0ng!pas",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["confirmPassword"])
  })
})
