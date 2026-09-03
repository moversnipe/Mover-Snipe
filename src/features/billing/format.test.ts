import { describe, expect, it } from "vitest"

import { formatPrice, fromUnixSeconds } from "@/features/billing/format"

describe("formatPrice", () => {
  it("formats recurring prices with their interval", () => {
    expect(
      formatPrice({
        unit_amount: 1000,
        currency: "usd",
        interval: "month",
        type: "recurring",
      })
    ).toBe("$10.00 / month")
  })

  it("formats one-time prices without an interval", () => {
    expect(
      formatPrice({
        unit_amount: 4900,
        currency: "usd",
        interval: null,
        type: "one_time",
      })
    ).toBe("$49.00")
  })
})

describe("fromUnixSeconds", () => {
  it("converts seconds to an ISO timestamp and passes null through", () => {
    expect(fromUnixSeconds(0)).toBe("1970-01-01T00:00:00.000Z")
    expect(fromUnixSeconds(null)).toBeNull()
  })
})
