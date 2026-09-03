import type { Tables } from "@/lib/supabase/database.types"

type Price = Pick<
  Tables<"prices">,
  "unit_amount" | "currency" | "interval" | "type"
>

/** "$10.00 / month" or "$49.00" for one-time prices. */
export const formatPrice = (price: Price, locale = "en-US"): string => {
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format((price.unit_amount ?? 0) / 100)

  if (price.type === "recurring" && price.interval) {
    return `${amount} / ${price.interval}`
  }
  return amount
}

/** Converts a Stripe unix timestamp (seconds) to an ISO string for timestamptz. */
export const fromUnixSeconds = (seconds: number | null | undefined) =>
  seconds == null ? null : new Date(seconds * 1000).toISOString()
