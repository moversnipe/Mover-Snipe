import { beforeEach, describe, expect, it, vi } from "vitest"

import { createCheckoutSession } from "@/features/billing/checkout"
import { AppError, ErrorCode } from "@/lib/errors"

const getUserOrThrow = vi.fn()
const getOrCreateStripeCustomerId = vi.fn()
const checkoutCreate = vi.fn()
const priceLookup = vi.fn()

vi.mock("@/features/auth/queries", () => ({
  getUserOrThrow: () => getUserOrThrow(),
}))

vi.mock("@/features/billing/customers", () => ({
  getOrCreateStripeCustomerId: (user: unknown) =>
    getOrCreateStripeCustomerId(user),
}))

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    checkout: {
      sessions: { create: (params: unknown) => checkoutCreate(params) },
    },
  },
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => priceLookup() }),
      }),
    }),
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const USER = { id: "user-1", email: "user@example.com" }

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserOrThrow.mockResolvedValue(USER)
    getOrCreateStripeCustomerId.mockResolvedValue("cus_1")
    priceLookup.mockResolvedValue({
      data: { id: "price_1", type: "recurring" },
      error: null,
    })
    checkoutCreate.mockResolvedValue({
      id: "cs_1",
      url: "https://checkout.stripe.com/cs_1",
    })
  })

  it("returns the hosted session url for a known price", async () => {
    await expect(
      createCheckoutSession({ priceId: "price_1" })
    ).resolves.toEqual({ url: "https://checkout.stripe.com/cs_1" })
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        mode: "subscription",
        line_items: [{ price: "price_1", quantity: 1 }],
      })
    )
  })

  it("uses payment mode for a one-time price", async () => {
    priceLookup.mockResolvedValue({
      data: { id: "price_1", type: "one_time" },
      error: null,
    })
    await createCheckoutSession({ priceId: "price_1" })
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "payment" })
    )
  })

  it("throws NOT_FOUND when the price is not readable", async () => {
    priceLookup.mockResolvedValue({ data: null, error: null })
    await expect(
      createCheckoutSession({ priceId: "price_missing" })
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND })
    expect(checkoutCreate).not.toHaveBeenCalled()
  })

  it("rethrows UNAUTHENTICATED before touching the database or Stripe", async () => {
    getUserOrThrow.mockRejectedValue(
      new AppError(ErrorCode.UNAUTHENTICATED, "Sign in required")
    )
    await expect(
      createCheckoutSession({ priceId: "price_1" })
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHENTICATED })
    expect(priceLookup).not.toHaveBeenCalled()
    expect(checkoutCreate).not.toHaveBeenCalled()
  })

  it("throws EXTERNAL_SERVICE when Stripe returns no url", async () => {
    checkoutCreate.mockResolvedValue({ id: "cs_1", url: null })
    await expect(
      createCheckoutSession({ priceId: "price_1" })
    ).rejects.toMatchObject({ code: ErrorCode.EXTERNAL_SERVICE })
  })
})
