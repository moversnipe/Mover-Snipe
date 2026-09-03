import { describe, expect, it } from "vitest"

import {
  pricingPlanIntervalSchema,
  pricingTypeSchema,
  subscriptionStatusSchema,
} from "@/features/billing/enums"

describe("billing enum schemas", () => {
  it("accept the values defined in the database enums", () => {
    expect(pricingTypeSchema.parse("recurring")).toBe("recurring")
    expect(pricingPlanIntervalSchema.parse("month")).toBe("month")
    expect(subscriptionStatusSchema.parse("past_due")).toBe("past_due")
  })

  it("reject unknown Stripe values so they never reach the database", () => {
    expect(() => pricingTypeSchema.parse("metered")).toThrow()
    expect(() => pricingPlanIntervalSchema.parse("quarter")).toThrow()
    expect(() => subscriptionStatusSchema.parse("brand_new_status")).toThrow()
  })
})
