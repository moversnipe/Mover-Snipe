import { describe, expect, it } from "vitest"

import { credentialsSchema } from "@/features/auth/schemas"

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
