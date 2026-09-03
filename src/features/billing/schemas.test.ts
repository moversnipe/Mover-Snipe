import { describe, expect, it } from "vitest"

import { checkoutSchema } from "@/features/billing/schemas"

describe("checkoutSchema", () => {
  it("accepts a Stripe price id", () => {
    expect(checkoutSchema.safeParse({ priceId: "price_123" }).success).toBe(
      true
    )
  })

  it("rejects ids that are not Stripe price ids", () => {
    expect(checkoutSchema.safeParse({ priceId: "prod_123" }).success).toBe(
      false
    )
    expect(checkoutSchema.safeParse({}).success).toBe(false)
  })
})
