import { z } from "zod"

/** Start of checkout: the Stripe price the user picked. */
export const checkoutSchema = z.object({
  priceId: z
    .string()
    .max(255)
    .startsWith("price_", "Invalid price")
    .describe("Stripe price id from the catalogue, such as price_123"),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/** Hard ceiling on one catalogue read. */
export const PRODUCTS_WITH_PRICES_MAX_LIMIT = 100

/** Catalogue read: how many active products to return, newest names last. */
export const productsWithPricesSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(PRODUCTS_WITH_PRICES_MAX_LIMIT)
    .default(PRODUCTS_WITH_PRICES_MAX_LIMIT)
    .describe("Maximum number of products to return"),
})

export type ProductsWithPricesInput = z.input<typeof productsWithPricesSchema>
