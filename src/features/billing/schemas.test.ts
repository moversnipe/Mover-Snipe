import { describe, expect, it } from "vitest"

import {
  PRODUCTS_WITH_PRICES_MAX_LIMIT,
  checkoutSchema,
  productsWithPricesSchema,
} from "@/features/billing/schemas"

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

  it("rejects an id longer than Stripe ever issues", () => {
    expect(
      checkoutSchema.safeParse({ priceId: `price_${"x".repeat(300)}` }).success
    ).toBe(false)
  })
})

describe("productsWithPricesSchema", () => {
  it("defaults the limit to the maximum", () => {
    expect(productsWithPricesSchema.parse({})).toEqual({
      limit: PRODUCTS_WITH_PRICES_MAX_LIMIT,
    })
  })

  it("accepts a smaller limit", () => {
    expect(productsWithPricesSchema.parse({ limit: 5 })).toEqual({ limit: 5 })
  })

  it.each([0, -1, 1.5, PRODUCTS_WITH_PRICES_MAX_LIMIT + 1])(
    "rejects a limit of %s",
    (limit) => {
      expect(productsWithPricesSchema.safeParse({ limit }).success).toBe(false)
    }
  )
})
